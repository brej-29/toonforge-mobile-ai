import 'package:flutter/material.dart';

import '../../services/settings/settings_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, required this.service});

  final SettingsService service;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _apiController;
  late CartoonMode _mode;
  late ModelVariant _variant;

  @override
  void initState() {
    super.initState();
    _apiController = TextEditingController(text: widget.service.apiBaseUrl);
    _mode = widget.service.defaultMode;
    _variant = widget.service.defaultVariant;
  }

  @override
  void dispose() {
    _apiController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    await widget.service.updateApiBaseUrl(_apiController.text.trim());
    await widget.service.updateDefaultMode(_mode);
    await widget.service.updateDefaultVariant(_variant);
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _apiController,
            decoration: const InputDecoration(
              labelText: 'API base URL',
              hintText: 'http://127.0.0.1:8000',
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Default mode',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          RadioListTile<CartoonMode>(
            value: CartoonMode.local,
            groupValue: _mode,
            title: const Text('Offline (TFLite on device)'),
            onChanged: (value) {
              if (value != null) {
                setState(() => _mode = value);
              }
            },
          ),
          RadioListTile<CartoonMode>(
            value: CartoonMode.cloud,
            groupValue: _mode,
            title: const Text('Cloud (FastAPI backend)'),
            onChanged: (value) {
              if (value != null) {
                setState(() => _mode = value);
              }
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'Default model variant',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          DropdownButton<ModelVariant>(
            value: _variant,
            items: const [
              DropdownMenuItem(
                value: ModelVariant.fp16,
                child: Text('fp16'),
              ),
              DropdownMenuItem(
                value: ModelVariant.int8,
                child: Text('int8'),
              ),
            ],
            onChanged: (value) {
              if (value != null) {
                setState(() => _variant = value);
              }
            },
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _save,
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}