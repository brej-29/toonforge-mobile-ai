# Bootstrap Flutter app

This document describes how to create the actual Flutter app for the Mobile AI Cartoon Generation project.

## Prerequisites

- Flutter SDK installed and on your `PATH`.
- A working Android or iOS development environment (Android Studio, Xcode, or CLI tools).

## Steps

1. **Create a new Flutter project**

   From the repo root:

   ```bash
   cd mobile_app
   flutter create mobile_ai_cartoon_app
   ```

   This will create a new Flutter project in `mobile_app/mobile_ai_cartoon_app/`.

2. **Align with architecture**

   In the generated project:

   - Add dependencies for:
     - `tflite_flutter` (for on-device inference).
     - `http` (for talking to the FastAPI backend in cloud mode).
   - Organize code into logical layers, for example:
     - `lib/features/cartoonization/`
     - `lib/services/tflite/`
     - `lib/services/api_client/`
     - `lib/ui/` (screens, widgets).

3. **Implement TFLite integration (offline mode)**

   - Add TFLite models (documented in `models/MODEL_REGISTRY.md`) to the app’s assets.
   - Use `tflite_flutter` to:
     - Load the model.
     - Run inference on selected/captured images.
   - Provide a simple UI toggle or mode selection for **Offline** mode.

4. **Implement API client (cloud mode)**

   - Add a minimal HTTP client that:
     - Calls the FastAPI backend (to be deployed separately).
     - Sends images or references and receives cartoonized images.
   - Provide a simple UI toggle or mode selection for **Cloud** mode.

5. **Integrate with UI**

   - Add screens for:
     - Selecting images from the gallery or capturing via camera.
     - Triggering offline/cloud cartoonization.
     - Displaying and sharing results.

6. **Keep it free-first**

   - Avoid adding services that require paid tiers unless:
     - They have a generous free tier.
     - They are strictly optional and clearly documented.

## Script helper

The `bootstrap_flutter_app.sh` script in this directory provides a simple helper for creating a Flutter app with a given name. See that file for usage details.