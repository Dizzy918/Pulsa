#!/usr/bin/env bash
# Downloads the YAMNet classification TFLite model (with metadata) used by the
# phone app and the Wear OS app. Safe to re-run; ~4.1 MB.
set -euo pipefail
cd "$(dirname "$0")/.."

URL_PRIMARY="https://storage.googleapis.com/download.tensorflow.org/models/tflite/task_library/audio_classification/rpi/lite-model_yamnet_classification_tflite_1.tflite"
URL_FALLBACK="https://storage.googleapis.com/download.tensorflow.org/models/tflite/task_library/audio_classification/android/lite-model_yamnet_classification_tflite_1.tflite"

mkdir -p assets/models
curl -sL --fail -o assets/models/yamnet.tflite "$URL_PRIMARY" \
  || curl -sL --fail -o assets/models/yamnet.tflite "$URL_FALLBACK"

# Keep the Wear OS copy in sync.
mkdir -p android/wear/src/main/assets
cp assets/models/yamnet.tflite android/wear/src/main/assets/yamnet.tflite

echo "OK: $(ls -la assets/models/yamnet.tflite | awk '{print $5}') bytes → assets/models/yamnet.tflite (+ wear copy)"
