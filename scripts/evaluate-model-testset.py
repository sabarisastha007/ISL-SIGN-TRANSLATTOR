import os
import sys
import numpy as np
import tensorflow as tf

MODEL_PATH = "ai/models/isl_alphabet.keras"
CLASS_NAMES_PATH = "ai/models/class_names.txt"
TEST_DIR = "ai/data/Testing"
SAMPLES_PER_CLASS = 20  # 20 * 26 = 520 test images

print("Loading model and classes...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

with open(CLASS_NAMES_PATH, "r") as f:
    class_names = [line.strip() for line in f if line.strip()]

print(f"Loaded {len(class_names)} classes: {class_names}")

total = 0
correct = 0
per_class_total = {c: 0 for c in class_names}
per_class_correct = {c: 0 for c in class_names}
confidences = []
confusions = {}

for label in class_names:
    folder = os.path.join(TEST_DIR, label)
    if not os.path.exists(folder):
        continue
    files = sorted([f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])[:SAMPLES_PER_CLASS]
    for fn in files:
        img_path = os.path.join(folder, fn)
        img = tf.keras.utils.load_img(img_path, target_size=(128, 128))
        arr = tf.keras.utils.img_to_array(img)  # [0, 255]
        batch = np.expand_dims(arr, axis=0)

        preds = model.predict(batch, verbose=0)[0]
        pred_idx = int(np.argmax(preds))
        pred_label = class_names[pred_idx]
        conf = float(np.max(preds))

        total += 1
        per_class_total[label] += 1
        confidences.append(conf)

        if pred_label == label:
            correct += 1
            per_class_correct[label] += 1
        else:
            confusions.setdefault((label, pred_label), 0)
            confusions[(label, pred_label)] += 1

print("\n" + "=" * 50)
print(f"EVALUATION RESULTS ({total} test images across {len(class_names)} classes):")
print(f"Overall Accuracy: {(correct / total) * 100:.2f}% ({correct}/{total})")
print(f"Mean Confidence: {np.mean(confidences) * 100:.2f}%")
print("=" * 50)

print("\nPer-Class Performance:")
for c in class_names:
    t = per_class_total[c]
    cor = per_class_correct[c]
    acc = (cor / t * 100) if t > 0 else 0
    print(f"Class '{c}': {cor}/{t} ({acc:.1f}%)")

print("\nTop Misclassifications (Ground Truth -> Predicted):")
sorted_confusions = sorted(confusions.items(), key=lambda x: x[1], reverse=True)[:10]
for (actual, pred), count in sorted_confusions:
    print(f"  {actual} -> {pred}: {count} times")

