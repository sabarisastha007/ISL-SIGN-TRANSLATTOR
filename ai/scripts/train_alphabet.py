import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# ============================================================
# IMPROVED ISL A-Z CLASSIFIER
# ============================================================

TRAIN_DIR = "ai/data/training"
VAL_DIR = "ai/data/validation"

IMG_SIZE = (128, 128)
BATCH_SIZE = 32
EPOCHS = 25

# ------------------------------------------------------------
# Load datasets
# ------------------------------------------------------------

train_ds = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical",
    shuffle=True,
    seed=42,
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    VAL_DIR,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical",
    shuffle=False,
)

class_names = train_ds.class_names

print("\nClasses:")
print(class_names)
print("Number of classes:", len(class_names))

# ------------------------------------------------------------
# Data augmentation
# ------------------------------------------------------------

augmentation = keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.12),
    layers.RandomZoom(0.15),
    layers.RandomTranslation(0.10, 0.10),
    layers.RandomContrast(0.15),
])

# ------------------------------------------------------------
# Model
# ------------------------------------------------------------

model = keras.Sequential([
    layers.Input(shape=(128, 128, 3)),

    augmentation,

    layers.Rescaling(1.0 / 255),

    layers.Conv2D(32, 3, padding="same", activation="relu"),
    layers.BatchNormalization(),
    layers.MaxPooling2D(),

    layers.Conv2D(64, 3, padding="same", activation="relu"),
    layers.BatchNormalization(),
    layers.MaxPooling2D(),

    layers.Conv2D(128, 3, padding="same", activation="relu"),
    layers.BatchNormalization(),
    layers.MaxPooling2D(),

    layers.Conv2D(256, 3, padding="same", activation="relu"),
    layers.BatchNormalization(),
    layers.MaxPooling2D(),

    layers.GlobalAveragePooling2D(),

    layers.Dense(256, activation="relu"),
    layers.Dropout(0.5),

    layers.Dense(len(class_names), activation="softmax")
])

# ------------------------------------------------------------
# Compile
# ------------------------------------------------------------

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.0005),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ------------------------------------------------------------
# Callbacks
# ------------------------------------------------------------

callbacks = [
    keras.callbacks.EarlyStopping(
        monitor="val_accuracy",
        patience=5,
        mode="max",
        restore_best_weights=True
    ),

    keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=2,
        min_lr=0.00001
    )
]

# ------------------------------------------------------------
# Train
# ------------------------------------------------------------

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=callbacks
)

# ------------------------------------------------------------
# Save model
# ------------------------------------------------------------

model.save("ai/models/isl_alphabet.keras")

with open("ai/models/class_names.txt", "w") as f:
    for name in class_names:
        f.write(name + "\n")

print("\n===================================")
print("IMPROVED TRAINING COMPLETE!")
print("Model saved:")
print("ai/models/isl_alphabet.keras")
print("===================================")