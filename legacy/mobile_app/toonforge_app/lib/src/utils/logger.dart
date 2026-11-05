import 'dart:convert';

void logInfo(String message, Map<String, Object?> context) {
  _log('INFO', message, context);
}

void logError(String message, Map<String, Object?> context) {
  _log('ERROR', message, context);
}

void _log(String level, String message, Map<String, Object?> context) {
  final payload = <String, Object?>{
    'level': level,
    'message': message,
    'context': context,
  };
  // ignore: avoid_print
  print(jsonEncode(payload));
}