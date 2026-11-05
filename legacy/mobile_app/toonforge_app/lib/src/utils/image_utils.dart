import 'dart:typed_data';

import 'package:image/image.dart' as img;

Uint8List? normalizePngBytes(Uint8List bytes) {
  final decoded = img.decodeImage(bytes);
  if (decoded == null) return null;
  return Uint8List.fromList(img.encodePng(decoded));
}