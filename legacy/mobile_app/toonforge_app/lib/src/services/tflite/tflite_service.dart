import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;
import 'package:tflite_flutter/tflite_flutter.dart';

class TfliteService {
  Future<TfliteResult> cartoonizeOffline(Uint8List imageBytes, {required String modelAsset}) async {
    final stopwatch = Stopwatch()..start();
    final result = await compute<_IsolateParams, TfliteResult>(
      _cartoonizeIsolate,
      _IsolateParams(imageBytes: imageBytes, modelAsset: modelAsset),
    );
    stopwatch.stop();
    return result.copyWith(totalMs: stopwatch.elapsedMilliseconds.toDouble());
  }
}

class TfliteResult {
  const TfliteResult({
    required this.success,
    this.outputBytes,
    this.errorMessage,
    this.preprocessMs,
    this.inferenceMs,
    this.postprocessMs,
    this.totalMs,
  });

  final bool success;
  final Uint8List? outputBytes;
  final String? errorMessage;
  final double? preprocessMs;
  final double? inferenceMs;
  final double? postprocessMs;
  final double? totalMs;

  TfliteResult copyWith({
    bool? success,
    Uint8List? outputBytes,
    String? errorMessage,
    double? preprocessMs,
    double? inferenceMs,
    double? postprocessMs,
    double? totalMs,
  }) {
    return TfliteResult(
      success: success ?? this.success,
      outputBytes: outputBytes ?? this.outputBytes,
      errorMessage: errorMessage ?? this.errorMessage,
      preprocessMs: preprocessMs ?? this.preprocessMs,
      inferenceMs: inferenceMs ?? this.inferenceMs,
      postprocessMs: postprocessMs ?? this.postprocessMs,
      totalMs: totalMs ?? this.totalMs,
    );
  }

  factory TfliteResult.success({
    required Uint8List outputBytes,
    required double preprocessMs,
    required double inferenceMs,
    required double postprocessMs,
    double? totalMs,
  }) {
    return TfliteResult(
      success: true,
      outputBytes: outputBytes,
      preprocessMs: preprocessMs,
      inferenceMs: inferenceMs,
      postprocessMs: postprocessMs,
      totalMs: totalMs,
    );
  }

  factory TfliteResult.error(String message) {
    return TfliteResult(
      success: false,
      errorMessage: message,
    );
  }
}

class _IsolateParams {
  _IsolateParams({
    required this.imageBytes,
    required this.modelAsset,
  });

  final Uint8List imageBytes;
  final String modelAsset;
}

TfliteResult _cartoonizeIsolate(_IsolateParams params) {
  try {
    final preprocessStopwatch = Stopwatch()..start();

    // Decode image
    final inputImage = img.decodeImage(params.imageBytes);
    if (inputImage == null) {
      return TfliteResult.error('Failed to decode input image.');
    }

    // Load interpreter from asset; Flutter bundles the model into the app.
    final interpreter = Interpreter.fromAsset(params.modelAsset);
    final inputShape = interpreter.getInputTensor(0).shape;
    final height = inputShape[1];
    final width = inputShape[2];

    // Resize image to model input size
    final resized = img.copyResize(inputImage, width: width, height: height);

    // Preprocess: RGB -> BGR, normalize to [-1, 1]
    final input = List.generate(
      1,
      (_) => List.generate(
        height,
        (y) => List.generate(
          width,
          (x) {
            final pixel = resized.getPixel(x, y);
            final r = img.getRed(pixel);
            final g = img.getGreen(pixel);
            final b = img.getBlue(pixel);

            final nb = (b / 255.0) * 2.0 - 1.0;
            final ng = (g / 255.0) * 2.0 - 1.0;
            final nr = (r / 255.0) * 2.0 - 1.0;

            return [nb, ng, nr];
          },
        ),
      ),
    );
    preprocessStopwatch.stop();

    final inferenceStopwatch = Stopwatch()..start();
    final output = List.generate(
      1,
      (_) => List.generate(
        height,
        (_) => List.generate(
          width,
          (_) => List<double>.filled(3, 0.0),
        ),
      ),
    );
    interpreter.run(input, output);
    inferenceStopwatch.stop();

    final postprocessStopwatch = Stopwatch()..start();
    final outputImage = img.Image(width: width, height: height);
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var nb = output[0][y][x][0] as double;
        var ng = output[0][y][x][1] as double;
        var nr = output[0][y][x][2] as double;

        nb = ((nb + 1.0) / 2.0).clamp(0.0, 1.0);
        ng = ((ng + 1.0) / 2.0).clamp(0.0, 1.0);
        nr = ((nr + 1.0) / 2.0).clamp(0.0, 1.0);

        final b = (nb * 255.0).round().clamp(0, 255);
        final g = (ng * 255.0).round().clamp(0, 255);
        final r = (nr * 255.0).round().clamp(0, 255);

        outputImage.setPixel(x, y, img.getColor(r, g, b));
      }
    }

    final pngBytes = Uint8List.fromList(img.encodePng(outputImage));
    postprocessStopwatch.stop();

    return TfliteResult.success(
      outputBytes: pngBytes,
      preprocessMs: preprocessStopwatch.elapsedMilliseconds.toDouble(),
      inferenceMs: inferenceStopwatch.elapsedMilliseconds.toDouble(),
      postprocessMs: postprocessStopwatch.elapsedMilliseconds.toDouble(),
    );
  } catch (e) {
    return TfliteResult.error('TFLite inference failed: $e');
  }
}