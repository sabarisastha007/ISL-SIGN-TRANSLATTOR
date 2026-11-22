import io
import json
import base64
import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
import server
from server import SimpleHandler

class CaptureHandler(SimpleHandler):
    def __init__(self, raw_req):
        self.rfile = io.BytesIO(raw_req)
        self.wfile = io.BytesIO()
        self.client_address = ('127.0.0.1', 54321)
        self.server = None
        self.raw_requestline = self.rfile.readline()
        self.parse_request()

# 1. Test /health
h_health = CaptureHandler(b"GET /health HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n")
h_health.do_GET()
resp_bytes = h_health.wfile.getvalue()
body = resp_bytes.split(b"\r\n\r\n")[1].decode()
data_health = json.loads(body)
print("Health Check Response:", data_health)
assert data_health["status"] == "ok"
assert data_health["class_count"] == 26

# 2. Test /predict with image A (175.jpg)
img_bytes = open('test_images/A.jpg/175.jpg', 'rb').read()
b64_str = base64.b64encode(img_bytes).decode('utf-8')
payload = json.dumps({"image": b64_str}).encode()

req_predict = f"POST /predict HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Length: {len(payload)}\r\n\r\n".encode() + payload
h_predict = CaptureHandler(req_predict)
h_predict.do_POST()
resp_pred_bytes = h_predict.wfile.getvalue()
body_pred = resp_pred_bytes.split(b"\r\n\r\n")[1].decode()
data_pred = json.loads(body_pred)
print("Predict Response for A.jpg/175.jpg:", data_pred)

assert data_pred["word"] == "A", f"Expected A, got {data_pred.get('word')}"
assert data_pred["confidence"] > 0.95, f"Expected confidence > 0.95, got {data_pred.get('confidence')}"

# 3. Test /predict with image B
img_b = open('ai/data/Training/B/0.jpg', 'rb').read()
b64_b = base64.b64encode(img_b).decode('utf-8')
payload_b = json.dumps({"image": b64_b}).encode()
req_b = f"POST /predict HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Length: {len(payload_b)}\r\n\r\n".encode() + payload_b
h_b = CaptureHandler(req_b)
h_b.do_POST()
data_b = json.loads(h_b.wfile.getvalue().split(b"\r\n\r\n")[1].decode())
print("Predict Response for B:", data_b)
assert data_b["word"] == "B", f"Expected B, got {data_b.get('word')}"
assert data_b["confidence"] > 0.95, f"Expected confidence > 0.95, got {data_b.get('confidence')}"

# 4. Test /predict with image L
img_l = open('ai/data/Training/L/0.jpg', 'rb').read()
b64_l = base64.b64encode(img_l).decode('utf-8')
payload_l = json.dumps({"image": b64_l}).encode()
req_l = f"POST /predict HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Length: {len(payload_l)}\r\n\r\n".encode() + payload_l
h_l = CaptureHandler(req_l)
h_l.do_POST()
data_l = json.loads(h_l.wfile.getvalue().split(b"\r\n\r\n")[1].decode())
print("Predict Response for L:", data_l)
assert data_l["word"] == "L", f"Expected L, got {data_l.get('word')}"
assert data_l["confidence"] > 0.95, f"Expected confidence > 0.95, got {data_l.get('confidence')}"

print("All backend handler verification tests passed successfully! 🚀")
