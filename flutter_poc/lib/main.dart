import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/dashboard_screen.dart';
import 'theme/sella_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const SellaFlutterPocApp());
}

/// Isolated visual/architecture PoC. Mock data only.
class SellaFlutterPocApp extends StatelessWidget {
  const SellaFlutterPocApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sella Flutter PoC',
      debugShowCheckedModeBanner: false,
      theme: buildSellaTheme(),
      home: const DashboardScreen(),
    );
  }
}
