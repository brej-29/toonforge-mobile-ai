import 'package:flutter/material.dart';

import 'features/home/home_screen.dart';
import 'services/settings/settings_service.dart';

class ToonforgeApp extends StatefulWidget {
  const ToonforgeApp({super.key});

  @override
  State<ToonforgeApp> createState() => _ToonforgeAppState();
}

class _ToonforgeAppState extends State<ToonforgeApp> {
  final SettingsService _settingsService = SettingsService();

  @override
  void initState() {
    super.initState();
    _settingsService.load();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ToonForge',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: HomeScreen(settingsService: _settingsService),
    );
  }
}