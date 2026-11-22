import tensorflow as tf
from pathlib import Path

MODEL_PATH = Path("ai/models/isl_alphabet.keras")
OUTPUT_PATH = Path("ai/models/isl_alphabet.h5")

print("Loading trained model...")
model = tf.keras.models.load_model(MODEL_PATH)

print("Creating clean inference model...")

# Rebuild a clean model with the same architecture and weights.
inputs = tf.keras.Input(shape=(128, 128, 3))

x = model.layers[1](inputs)

for layer in model.layers[2:]:
    # Skip training-only Dropout during inference
    if isinstance(layer, tf.keras.layers.Dropout):
        continue
    x = layer(x, training=False)

clean_model = tf.keras.Model(inputs, x)

clean_model.set_weights(model.get_weights())

print("Saving clean H5 model...")
clean_model.save(OUTPUT_PATH, include_optimizer=False)

print("===================================")
print("EXPORT COMPLETE!")
print(f"Model saved: {OUTPUT_PATH}")
print("===================================")