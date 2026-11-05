# Mobile build and distribution

This document describes how to build and distribute the **ToonForge** Flutter app (`mobile_app/toonforge_app/`) for Android and iOS, with a focus on **free-first** workflows.

> CI for this repository does **not** build or test the Flutter app. All steps here are intended for local development and manual builds.

---

## 1. Local development

### 1.1 Prerequisites

- Flutter SDK (3.x).
- Android Studio or VS Code with Flutter/Dart plugins.
- Xcode (for iOS builds on macOS).
- A running FastAPI backend (for cloud mode):
  - Typically `http://127.0.0.1:8000` during development.

### 1.2 Setup

From the repository root:

```bash
cd mobile_app/toonforge_app
flutter pub get
```

Ensure you have copied a TFLite model into the app assets (offline mode):

```bash
# From repo root:
bash mobile_app/scripts/copy_model_to_assets.sh cartoongan-fp16.tflite
# or on Windows PowerShell:
# powershell -ExecutionPolicy Bypass -File mobile_app/scripts/copy_model_to_assets.ps1 -ModelFile cartoongan-fp16.tflite
```

Update the Dart code or filename to match the asset if needed (see `lib/src/services/tflite/tflite_service.dart` and `lib/src/features/home/home_screen.dart`).

### 1.3 Run on device or emulator

From `mobile_app/toonforge_app`:

```bash
flutter run
```

Choose a connected device or emulator. The app will:

- Allow picking images from the gallery.
- Run offline TFLite or cloud mode depending on settings.
- Show latency and status messages.

---

## 2. Android builds

### 2.1 Debug builds (local)

To generate a debug APK:

```bash
cd mobile_app/toonforge_app
flutter build apk --debug
```

The APK will be located at:

```text
build/app/outputs/flutter-apk/app-debug.apk
```

You can install this on devices via adb or drag-and-drop (depending on OS/tools).

### 2.2 Release builds (store-ready)

For a release APK:

```bash
flutter build apk --release
```

For a Play Store app bundle (AAB):

```bash
flutter build appbundle --release
```

Follow Flutter’s official docs for:

- App signing (keystore).
- Package name configuration.
- Versioning.

### 2.3 Store fees and alternatives

- **Google Play**:
  - Requires a one-time **registration fee** (check current pricing on the Play Console).
  - After registration, you can upload AABs for internal/testing/production tracks.

Free distribution alternatives:

- Share the **APK** directly via:
  - GitHub Releases.
  - Personal site or cloud storage.
  - Direct file sharing for testers.

> Note: Sideloading APKs may require enabling “install from unknown sources” on Android devices.

---

## 3. iOS builds

### 3.1 Debug builds (simulator)

On macOS, from `mobile_app/toonforge_app`:

```bash
flutter run
```

Select an iOS simulator. Ensure Xcode command-line tools and Cocoapods are installed.

### 3.2 Release builds

To build for iOS:

```bash
flutter build ios --release
```

This will create an Xcode project under `ios/` that you can open and archive via Xcode for distribution.

### 3.3 Apple Developer Program and TestFlight

- To distribute to real devices **outside your own development team**, you typically need the **Apple Developer Program**, which has an **annual fee** (see Apple’s official site for current pricing).
- With an Apple Developer account, you can:
  - Use **TestFlight** for beta distribution.
  - Publish to the App Store.

Free-ish alternatives for demos:

- Build directly onto a locally connected device via Xcode (requires signing and provisioning).
- Use personal/team provisioning profiles for limited device testing.

---

## 4. Free portfolio distribution options

If your goal is to show the app as part of a portfolio without app store fees:

### 4.1 Android

- Generate a **debug or release APK**.
- Publish the APK to:
  - GitHub Releases.
  - A public cloud bucket or static site.
- Include clear instructions for sideloading on Android devices.

### 4.2 iOS

- For local demos:
  - Run the app directly from Xcode or `flutter run` onto your own device.
  - Demonstrate via simulator during interviews or screen shares.

Due to Apple’s policies, free public distribution for iOS is more constrained than Android; TestFlight/App Store typically require the paid Apple Developer Program.

---

## 5. Backend and cloud considerations

The mobile app’s **cloud mode** uses the FastAPI backend:

- Endpoint: `POST /v1/cartoonize`.
- Configuration via settings screen (`API base URL`).

For meaningful cloud tests:

1. Run the backend locally (`make api`) and set API base URL to `http://10.0.2.2:8000` for Android emulator, or `http://127.0.0.1:8000` for physical devices via port forwarding.
2. Or, deploy the backend to a public host (HF Spaces or another free CPU host) and point the app at that URL.

Offline mode does not require network connectivity and uses only the embedded TFLite model.

---

## 6. Summary

- Use `flutter run` for local development on emulator/device.
- Use `flutter build apk/appbundle/ios` for release artifacts.
- Be aware of:
  - **Google Play** one-time registration fee.
  - **Apple Developer Program** annual fee for TestFlight/App Store.
- For free portfolio demos:
  - Distribute Android APKs directly.
  - Use simulators or device builds for iOS.
- Connect cloud mode to the same FastAPI backend used by the Streamlit web UI and Gradio Space, keeping the system consistent end-to-end.