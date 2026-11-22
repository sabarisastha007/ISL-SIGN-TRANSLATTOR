import tensorflow as tf
import numpy as np
from pathlib import Path

MODEL_PATH = "ai/models/isl_alphabet.keras"
LABEL_PATH = "ai/models/class_names.txt"
TEST_DIR = Path("ai/data/testing")

# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Load labels
labels = [
    line.strip()
    for line in open(LABEL_PATH, "r")
    if line.strip()
]

print("Model loaded.")
print("Classes:", labels)

# Find first image from each class
correct = 0
total = 0

for label in labels:
    folder = TEST_DIR / label

    images = list(folder.glob("*.jpg")) + list(folder.glob("*.jpeg")) + list(folder.glob("*.png"))

    if not images:
        print(f"{label}: no test image found")
        continue

    image_path = images[0]

    img = tf.keras.utils.load_img(
        image_path,
        target_size=(128, 128)
    )

    img_array = tf.keras.utils.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array, verbose=0)

    class_id = int(np.argmax(prediction[0]))
    predicted = labels[class_id]
    confidence = float(np.max(prediction[0])) * 100

    result = "✓" if predicted == label else "✗"

    print(
        f"{result} Actual: {label} | "
        f"Predicted: {predicted} | "
        f"Confidence: {confidence:.1f}%"
    )

    total += 1

    if predicted == label:
        correct += 1

print("\n==============================")
print(f"Correct: {correct}/{total}")

if total:
    print(f"Test accuracy: {(correct / total) * 100:.1f}%")

print("==============================")