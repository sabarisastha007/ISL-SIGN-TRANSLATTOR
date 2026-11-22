import os
import tensorflow as tf
import numpy as np

MODEL_PATH = "ai/models/isl_alphabet.keras"
LABEL_PATH = "ai/models/class_names.txt"
TEST_DIR = "ai/data/Testing"

model = tf.keras.models.load_model(MODEL_PATH, compile=False)

with open(LABEL_PATH, "r") as f:
    class_names = [line.strip() for line in f if line.strip()]

samples_per_class = 20
all_images = []
all_labels = []

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
preds = model(batch, training=False).numpy()
pred_indices = np.argmax(preds, axis=1)
confidences = np.max(preds, axis=1)

confusion = np.zeros((len(class_names), len(class_names)), dtype=int)
for actual, pred in zip(all_labels, pred_indices):
    confusion[actual, pred] += 1

print("\n" + "="*70)
print(f"FULL DATASET EVALUATION: {len(batch)} samples across 26 classes ({samples_per_class}/class)")
print("="*70)

overall_correct = 0
total = len(all_labels)

for idx, c in enumerate(class_names):
    mask = (np.array(all_labels) == idx)
    class_total = int(np.sum(mask))
    class_correct = int(np.sum(mask & (pred_indices == idx)))
    class_conf = float(np.mean(confidences[mask]))
    overall_correct += class_correct
    acc = (class_correct / class_total * 100) if class_total > 0 else 0
    top_pred = class_names[int(np.argmax(confusion[idx]))]
    status = "PASS" if acc >= 90.0 else "CONFUSED"
    
    err_desc = ""
    if class_correct < class_total:
        wrong_mask = mask & (pred_indices != idx)
        wrongs = pred_indices[wrong_mask]
        u_w, cnts = np.unique(wrongs, return_counts=True)
        err_desc = " -> confused with: " + ", ".join([f"{class_names[w]}({cnt})" for w, cnt in zip(u_w, cnts)])
        
    print(f"  [{status:8s}] {c}: {class_correct:2d}/{class_total} ({acc:5.1f}%) | Avg Conf: {class_conf*100:5.1f}%{err_desc}")

print("="*70)
print(f"OVERALL DATASET ACCURACY: {overall_correct}/{total} ({overall_correct/total*100:.2f}%)")
print(f"PERFECT CLASSES (100%): {sum(1 for i in range(26) if confusion[i, i] == samples_per_class)} / 26")
print("="*70)

