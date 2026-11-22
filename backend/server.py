import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH = os.path.join(PROJECT_ROOT, 'ai', 'models', 'isl_alphabet.keras')
CLASS_NAMES_PATH = os.path.join(PROJECT_ROOT, 'ai', 'models', 'class_names.txt')

try:
    import tensorflow as tf
except Exception as e:
    sys.stderr.write(json.dumps({"error": "TensorFlow import failed", "details": str(e)}) + "\n")
    raise

try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
except Exception as e:
    sys.stderr.write(json.dumps({"error": "Model loading failed", "details": str(e)}) + "\n")
    raise

try:
    with open(CLASS_NAMES_PATH, 'r', encoding='utf-8') as f:
        CLASS_NAMES = [line.strip() for line in f if line.strip()]
except Exception as e:
    sys.stderr.write(json.dumps({"error": "Class names loading failed", "details": str(e)}) + "\n")
    raise

INPUT_SHAPE = model.input_shape
OUTPUT_SHAPE = model.output_shape

class SimpleHandler(BaseHTTPRequestHandler):
    def _set_json(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_json(204)

    def _json_response(self, data, status=200):
        self._set_json(status)
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        if urlparse(self.path).path == '/health':
            self._json_response({
                "status": "ok",
                "model_input_shape": INPUT_SHAPE,
                "model_output_shape": OUTPUT_SHAPE,
                "class_count": len(CLASS_NAMES),
                "class_names_preview": CLASS_NAMES[:5]
            })
        else:
            self._json_response({"error": "Not found"}, status=404)

    def do_POST(self):
        if urlparse(self.path).path != '/predict':
            self._json_response({"error": "Not found"}, status=404)
            return
        # Read request body
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._json_response({"error": "Malformed JSON"}, status=400)
            return
        # Prefer image input; if provided, ignore landmarks
        b64_image = payload.get('image')
        if isinstance(b64_image, str):
            import base64
            if ',' in b64_image:
                b64_image = b64_image.split(',', 1)[1]
            try:
                image_bytes = base64.b64decode(b64_image)
            except Exception:
                self._json_response({"error": "Invalid base64 encoding"}, status=400)
                return
            try:
                img = tf.io.decode_image(image_bytes, channels=3)
            except Exception as e:
                self._json_response({"error": f"Image decode failed: {str(e)}"}, status=400)
                return
            # Resize to model input shape (model contains embedded Rescaling(1/255) layer)
            img = tf.image.resize(img, [128, 128])
            img_batch = tf.expand_dims(img, axis=0)
            # Fast direct tensor forward pass (3x faster than model.predict on CPU)
            preds = model(img_batch, training=False)[0]
            pred_idx = int(tf.argmax(preds).numpy())
            confidence = float(preds[pred_idx].numpy())
            if pred_idx >= len(CLASS_NAMES):
                self._json_response({"error": "Model output index out of range"}, status=500)
                return

            # Top 3 predictions
            top3_indices = tf.argsort(preds, direction='DESCENDING')[:3].numpy()
            top3 = [
                {"word": CLASS_NAMES[int(i)], "confidence": float(preds[int(i)].numpy())}
                for i in top3_indices
            ]
            top3_log = ", ".join([f"{item['word']}:{item['confidence']*100:.1f}%" for item in top3])
            sys.stdout.write(f"[Predict] Top 3 -> {top3_log}\n")
            sys.stdout.flush()

            self._json_response({
                "word": CLASS_NAMES[pred_idx],
                "confidence": confidence,
                "top3": top3
            })
            return
        # Fallback: reject flat landmark input (kept for compatibility)
        landmarks = payload.get('landmarks')
        if not isinstance(landmarks, list):
            self._json_response({"error": "'landmarks' must be a list"}, status=400)
            return
        if len(landmarks) != 63:
            self._json_response({"error": f"Expected 63 landmark values, got {len(landmarks)}"}, status=400)
            return
        try:
            _ = [float(v) for v in landmarks]
        except (ValueError, TypeError):
            self._json_response({"error": "All landmark values must be numeric"}, status=400)
            return
        self._json_response({"error": f"Model expects image tensor {INPUT_SHAPE}, received flat landmarks."}, status=400)

def run_server(host='127.0.0.1', port=8000):
    server = HTTPServer((host, port), SimpleHandler)
    print(f"Server running at http://{host}:{port}")
    server.serve_forever()

if __name__ == '__main__':
    run_server()
