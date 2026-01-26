import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../services/api/api_client.dart';
import '../../services/settings/settings_service.dart';
import '../../services/tflite/tflite_service.dart';
import '../../utils/image_utils.dart';
import '../../utils/logger.dart';
import '../settings/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.settingsService});

  final SettingsService settingsService;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ImagePicker _picker = ImagePicker();
  late final TfliteService _tfliteService;
  late final ApiClient _apiClient;

  Uint8List? _inputBytes;
  Uint8List? _outputBytes;
  bool _isProcessing = false;
  String? _statusMessage;
  double? _totalMs;

  @override
  void initState() {
    super.initState();
    _tfliteService = TfliteService();
    _apiClient = ApiClient(widget.settingsService);
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1024);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    setState(() {
      _inputBytes = bytes;
      _outputBytes = null;
      _statusMessage = null;
      _totalMs = null;
    });
  }

  CartoonMode get _currentMode => widget.settingsService.defaultMode;

  ModelVariant get _currentVariant => widget.settingsService.defaultVariant;

  Future<void> _runCartoonize() async {
    if (_inputBytes == null) {
      setState(() {
        _statusMessage = 'Please pick an image first.';
      });
      return;
    }

    setState(() {
      _isProcessing = true;
      _statusMessage = null;
      _totalMs = null;
    });

    final mode = _currentMode;
    logInfo('Cartoonize pressed', {
      'mode': mode.name,
      'variant': _currentVariant.name,
    });

    if (mode == CartoonMode.local) {
      await _runOffline();
    } else {
      await _runCloud();
    }

    setState(() {
      _isProcessing = false;
    });
  }

  Future<void> _runOffline() async {
    if (_inputBytes == null) return;
    const modelAsset = 'assets/models/cartoon_fp16.tflite'; // Logical name; actual file must exist.

    final result = await _tfliteService.cartoonizeOffline(
      _inputBytes!,
      modelAsset: modelAsset,
    );

    if (!result.success || result.outputBytes == null) {
      setState(() {
        _statusMessage = result.errorMessage ?? 'Offline cartoonization failed.';
      });
      logError('Offline cartoonization failed', {'error': result.errorMessage ?? 'unknown'});
      return;
    }

    setState(() {
      _outputBytes = result.outputBytes;
      _totalMs = result.totalMs;
      _statusMessage = 'Offline cartoonization succeeded.';
    });
  }

  Future<void> _runCloud() async {
    if (_inputBytes == null) return;
    final result = await _apiClient.cartoonizeCloud(
      imageBytes: _inputBytes!,
      variant: _currentVariant,
    );

    if (!result.success || result.bytes == null) {
      setState(() {
        _statusMessage = result.errorMessage ?? 'Cloud cartoonization failed.';
      });
      logError('Cloud cartoonization failed', {'error': result.errorMessage ?? 'unknown'});
      return;
    }

    setState(() {
      _outputBytes = result.bytes;
      _totalMs = double.tryParse(result.totalMs ?? '');
      _statusMessage = 'Cloud cartoonization succeeded.';
    });
  }

  Future<void> _shareResult() async {
    if (_outputBytes == null) return;
    await Share.shareXFiles(
      [
        XFile.fromData(
          _outputBytes!,
          name: 'toonforge.png',
          mimeType: 'image/png',
        ),
      ],
      text: 'Cartoonized with ToonForge',
    );
  }

  Future<void> _saveResultToAppStorage() async {
    if (_outputBytes == null) return;
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/toonforge_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(_outputBytes!);
      setState(() {
        _statusMessage = 'Saved to app storage: ${file.path}';
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Failed to save image: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final inputImageWidget = _inputBytes != null
        ? Image.memory(_inputBytes!, fit: BoxFit.contain)
        : const Text('No image selected.');

    final outputImageWidget = _outputBytes != null
        ? Image.memory(_outputBytes!, fit: BoxFit.contain)
        : const Text('No output yet.');

    return Scaffold(
      appBar: AppBar(
        title: const Text('ToonForge'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => SettingsScreen(service: widget.settingsService),
                ),
              );
              setState(() {});
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                ElevatedButton.icon(
                  icon: const Icon(Icons.photo_library),
                  label: const Text('Pick image'),
                  onPressed: _isProcessing ? null : _pickImage,
                ),
                const SizedBox(width: 16),
                Text('Mode: ${_currentMode.name}, Variant: ${_currentVariant.name}'),
              ],
            ),
          ),
          if (_isProcessing) const LinearProgressIndicator(),
          Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      const Text('Input'),
                      const SizedBox(height: 8),
                      Expanded(child: Center(child: inputImageWidget)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    children: [
                      const Text('Output'),
                      const SizedBox(height: 8),
                      Expanded(child: Center(child: outputImageWidget)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (_totalMs != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text('Total time: ${_totalMs!.toStringAsFixed(2)} ms'),
            ),
          if (_statusMessage != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(_statusMessage!),
            ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                ElevatedButton(
                  onPressed: _isProcessing ? null : _runCartoonize,
                  child: const Text('Cartoonize'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: _outputBytes != null ? _shareResult : null,
                  child: const Text('Share result'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: _outputBytes != null ? _saveResultToAppStorage : null,
                  child: const Text('Save to app storage'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}