import os
import tensorflow as tf
import numpy as np

MODEL_PATH = "ai/models/isl_alphabet.keras"
LABEL_PATH = "ai/models/class_names.txt"
TEST_DIR = "ai/data/Testing"

model = tf.keras.models.load_model(MODEL_PATH, compile=False)

with open(LABEL_PATH, "r") as f:
    class_names = [line.strip() for line in f if line.strip()]

all_images = []
all_labels = []
samples_per_class = 20

for idx, c in enumerate(class_names):
    folder = os.path.join(TEST_DIR, c)
    if not os.path.exists(folder):
        continue
    files = sorted(os.listdir(folder))[:samples_per_class]
    for fn in files:
        raw = tf.io.read_file(os.path.join(folder, fn))
        img = tf.io.decode_image(raw, channels=3)
        img = tf.image.resize(img, [128, 128])
        all_images.append(img.numpy())
        all_labels.append(idx)

batch = np.array(all_images, dtype=np.float32)
print(f"Loaded {len(batch)} images across {len(class_names)} classes.")

# Predict in one batched pass
preds = model.predict(batch, batch_size=64, verbose=0)
pred_indices = np.argmax(preds, axis=1)
confidences = np.max(preds, axis=1)

confusion = np.zeros((len(class_names), len(class_names)), dtype=int)
for actual, pred in zip(all_labels, pred_indices):
    confusion[actual, pred] += 1

print("\n" + "="*50)
print("PER-CLASS EVALUATION (20 samples per class):")
print("="*50)

overall_correct = 0
total = len(all_labels)

for idx, c in enumerate(class_names):
    class_mask = (np.array(all_labels) == idx)
    class_total = int(np.sum(class_mask))
    class_correct = int(np.sum((np.array(all_labels) == idx) & (pred_indices == idx)))
    class_conf = float(np.mean(confidences[class_mask]))
    overall_correct += class_correct
    acc = (class_correct / class_total * 100) if class_total > 0 else 0
    # Top predicted classes if any errors
    errors = []
    if class_correct < class_total:
        wrong_preds = pred_indices[class_mask & (pred_indices != idx)]
        unique_wrongs, counts = np.unique(wrong_preds, return_counts=True)
        for w_idx, cnt in zip(unique_wrongs, counts):
            errors.append(f"{class_names[w_idx]}:{cnt}")
    err_str = f" [Errors -> {', '.join(errors)}]" if errors else ""
    print(f"  {c}: {class_correct:2d}/{class_total} ({acc:5.1f}%) | avg_conf={class_conf*100:5.1f}%{err_str}")

print("="*50)
print(f"OVERALL ACCURACY: {overall_correct}/{total} ({overall_correct/total*100:.2f}%)")
print("="*50)

