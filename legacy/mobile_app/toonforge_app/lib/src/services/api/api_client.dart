import 'dart:async';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../settings/settings_service.dart';

class ApiClient {
  ApiClient(this._settings);

  final SettingsService _settings;

  Future<ApiResult> cartoonizeCloud({
    required Uint8List imageBytes,
    required ModelVariant variant,
  }) async {
    final uri = Uri.parse('${_settings.apiBaseUrl}/v1/cartoonize');
    final request = http.MultipartRequest('POST', uri)
      ..fields['mode'] = 'cloud'
      ..fields['model_variant'] = _variantToString(variant)
      ..fields['output'] = 'png'
      ..files.add(
        http.MultipartFile.fromBytes(
          'image',
          imageBytes,
          filename: 'upload.png',
        ),
      );

    try {
      final streamed = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamed);
      if (response.statusCode != 200) {
        return ApiResult.error(
          'Cloud API error (${response.statusCode}): ${response.body}',
        );
      }
      final totalMs = response.headers['x-latency-total-ms'];
      final inferMs = response.headers['x-latency-infer-ms'];
      return ApiResult.success(
        bytes: response.bodyBytes,
        totalMs: totalMs,
        inferMs: inferMs,
        mode: response.headers['x-mode'],
        variant: response.headers['x-variant'],
      );
    } on TimeoutException {
      return ApiResult.error('Cloud request timed out. Please try again.');
    } catch (e) {
      return ApiResult.error('Cloud request failed: $e');
    }
  }

  String _variantToString(ModelVariant variant) {
    switch (variant) {
      case ModelVariant.fp16:
        return 'fp16';
      case ModelVariant.int8:
        return 'int8';
    }
  }
}

class ApiResult {
  ApiResult._({
    required this.success,
    this.bytes,
    this.errorMessage,
    this.totalMs,
    this.inferMs,
    this.mode,
    this.variant,
  });

  factory ApiResult.success({
    required Uint8List bytes,
    String? totalMs,
    String? inferMs,
    String? mode,
    String? variant,
  }) {
    return ApiResult._(
      success: true,
      bytes: bytes,
      totalMs: totalMs,
      inferMs: inferMs,
      mode: mode,
      variant: variant,
    );
  }

  factory ApiResult.error(String message) {
    return ApiResult._(
      success: false,
      errorMessage: message,
    );
  }

  final bool success;
  final Uint8List? bytes;
  final String? errorMessage;
  final String? totalMs;
  final String? inferMs;
  final String? mode;
  final String? variant;
}