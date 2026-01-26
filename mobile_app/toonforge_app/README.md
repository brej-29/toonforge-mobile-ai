# ToonForge Flutter App

This is the **ToonForge** Flutter app for the Mobile AI Cartoon Generation project.

It provides:

- Offline **TFLite** cartoonization using `tflite_flutter` (model not committed).
- Cloud mode via the FastAPI backend (`/v1/cartoonize`).
- Image picking from gallery, progress indicators, latency display.
- A settings screen for API base URL, default mode, and model variant.
- Share and save flows for cartoonized images.

> CI does **not** build or test this app. It is intended for local development only.

## Requirements

- Flutter SDK (3.x).
- Android Studio / Xcode for platform builds.
- A running FastAPI backend (for cloud mode).
- A TFLite model copied into `assets/models/` (for offline mode).

## Setup

From the repo root:

```bash
cd mobile_app/toonforge_app
flutter pub get
```

### Copying a TFLite model into assets

1. Use the Python cartoonizer pipeline to download or convert a model:

```bash
cd models/cartoonizer
pip install -r requirements.txt
pip install -e .
python -m cartoonizer download --model-id cartoongan-fp16
```

2. Copy the `.tflite` file into the Flutter assets folder:

```bash
# From repo root
bash mobile_app/scripts/copy_model_to_assets.sh cartoongan-fp16.tflite
# or on Windows PowerShell:
# powershell -ExecutionPolicy Bypass -File mobile_app/scripts/copy_model_to_assets.ps1 -ModelFile cartoongan-fp16.tflite
```

3. Ensure `pubspec.yaml` includes:

```yaml
flutter:
  assets:
    - assets/models/
```

The Dart code assumes a model asset path like:

```dart
const modelAsset = 'assets/models/cartoon_fp16.tflite';
```

You may need to rename your file accordingly (or adjust the code to match the filename).

## Running the app

From the repo root:

```bash
cd mobile_app/toonforge_app
flutter pub get
flutter run
```

Choose an emulator or device as appropriate.

## App behavior

### Home screen

- **Pick image**: opens the gallery (via `image_picker`).
- **Mode**: shows the current default mode (offline `local` or `cloud`).
- **Variant**: shows the current default model variant (`fp16` or `int8`).
- **Cartoonize** button:
  - In **offline** mode:
    - Runs TFLite inference using `tflite_flutter` in an isolate.
    - Preprocesses image to match model input (resize and normalize to [-1, 1]).
    - Postprocesses output to PNG and displays it.
  - In **cloud** mode:
    - Sends the image to the FastAPI `/v1/cartoonize` endpoint via multipart upload.
    - Reads timing headers and displays them.
- **Share result**: uses `share_plus` to share the PNG.
- **Status and latency**: shows the outcome and total time in ms.

### Settings screen

Accessible via the gear icon in the app bar.

Configurable options:

- **API base URL** (e.g. `http://127.0.0.1:8000` for local dev).
- **Default mode**: Offline (TFLite) or Cloud (FastAPI).
- **Default model variant**: `fp16` or `int8`.

Settings are persisted using `SharedPreferences`.

## Notes

- The app assumes that the TFLite model uses a CartoonGAN-style interface:
  - Input: `1 x H x W x 3` float32, BGR, normalized to [-1, 1].
  - Output: same shape, normalized to [-1, 1], BGR.
- If your model uses a different normalization or layout, adjust the pre/post-processing logic in:
  - `lib/src/services/tflite/tflite_service.dart`.

For build instructions (APK, app bundle, iOS builds, and free distribution options), see `docs/mobile_build.md`.