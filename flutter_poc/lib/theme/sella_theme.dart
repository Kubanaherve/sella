import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Official Sella brand tokens (mirrors src/lib/brand.ts).
class SellaColors {
  static const blue = Color(0xFF1A6FFF);
  static const blueDeep = Color(0xFF0B4FD9);
  static const ink = Color(0xFF0A1F4D);
  static const sand = Color(0xFFF3F7FF);
  static const muted = Color(0xFF64748B);
  static const success = Color(0xFF16A34A);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFB91C1C);
  static const whatsapp = Color(0xFF25D366);
}

ThemeData buildSellaTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: SellaColors.blue,
      primary: SellaColors.blue,
      secondary: SellaColors.blueDeep,
      surface: Colors.white,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: SellaColors.sand,
  );

  final textTheme = GoogleFonts.plusJakartaSansTextTheme(base.textTheme).apply(
    bodyColor: SellaColors.ink,
    displayColor: SellaColors.ink,
  );

  return base.copyWith(
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: SellaColors.blueDeep,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w800,
        fontSize: 18,
        color: Colors.white,
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: SellaColors.blue,
      foregroundColor: Colors.white,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: SellaColors.blue,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: GoogleFonts.plusJakartaSans(
          fontWeight: FontWeight.w800,
          fontSize: 16,
        ),
      ),
    ),
  );
}
