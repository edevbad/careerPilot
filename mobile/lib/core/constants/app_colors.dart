import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Backgrounds ─────────────────────────────────
  static const Color background = Color(0xFF080C18);
  static const Color surface = Color(0xFF0F1629);
  static const Color surfaceVariant = Color(0xFF1A2235);
  static const Color surfaceCard = Color(0xFF131929);

  // ── Brand ────────────────────────────────────────
  static const Color primary = Color(0xFF6366F1);
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF4F46E5);
  static const Color secondary = Color(0xFF8B5CF6);

  // ── Accents ──────────────────────────────────────
  static const Color xpGold = Color(0xFFF59E0B);
  static const Color xpGoldLight = Color(0xFFFBBF24);
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFF34D399);
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFF87171);
  static const Color warning = Color(0xFFF97316);
  static const Color info = Color(0xFF06B6D4);

  // ── Text ─────────────────────────────────────────
  static const Color textPrimary = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // ── Borders ──────────────────────────────────────
  static const Color border = Color(0xFF1E2D45);
  static const Color borderLight = Color(0xFF2D3F5C);

  // ── Gradients ────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color.fromARGB(255, 173, 174, 228), Color.fromARGB(255, 196, 183, 226)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient xpGradient = LinearGradient(
    colors: [Color.fromARGB(255, 225, 181, 106), Color.fromARGB(255, 239, 68, 68)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [Color.fromARGB(255, 16, 185, 129), Color.fromARGB(255, 5, 150, 105)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient bgGradient = LinearGradient(
    colors: [Color.fromARGB(255, 8, 12, 24), Color.fromARGB(255, 13, 20, 37)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient streakGradient = LinearGradient(
    colors: [Color.fromARGB(255, 249, 115, 22), Color.fromARGB(255, 239, 68, 68)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient roadmapGradient = LinearGradient(
    colors: [Color.fromARGB(255, 6, 182, 212), Color.fromARGB(255, 99, 102, 241)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
