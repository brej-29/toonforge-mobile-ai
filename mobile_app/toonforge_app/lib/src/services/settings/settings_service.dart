import 'package:shared_preferences/shared_preferences.dart';

enum CartoonMode { local, cloud }

enum ModelVariant { fp16, int8 }

class SettingsService {
  static const _keyApiBaseUrl = 'api_base_url';
  static const _keyDefaultMode = 'default_mode';
  static const _keyDefaultVariant = 'default_variant';

  String apiBaseUrl = 'http://127.0.0.1:8000';
  CartoonMode defaultMode = CartoonMode.local;
  ModelVariant defaultVariant = ModelVariant.fp16;

  bool _loaded = false;

  bool get isLoaded => _loaded;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    apiBaseUrl = prefs.getString(_keyApiBaseUrl) ?? apiBaseUrl;

    final modeIndex = prefs.getInt(_keyDefaultMode);
    if (modeIndex != null && modeIndex >= 0 && modeIndex < CartoonMode.values.length) {
      defaultMode = CartoonMode.values[modeIndex];
    }

    final variantIndex = prefs.getInt(_keyDefaultVariant);
    if (variantIndex != null && variantIndex >= 0 && variantIndex < ModelVariant.values.length) {
      defaultVariant = ModelVariant.values[variantIndex];
    }

    _loaded = true;
  }

  Future<void> updateApiBaseUrl(String value) async {
    apiBaseUrl = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyApiBaseUrl, value);
  }

  Future<void> updateDefaultMode(CartoonMode mode) async {
    defaultMode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyDefaultMode, mode.index);
  }

  Future<void> updateDefaultVariant(ModelVariant variant) async {
    defaultVariant = variant;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyDefaultVariant, variant.index);
  }
}