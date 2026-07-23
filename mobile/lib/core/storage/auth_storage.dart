import 'package:shared_preferences/shared_preferences.dart';

/// Thin wrapper around SharedPreferences for persisting the auth access token
/// and a cached user JSON string between app sessions.
class AuthStorage {
  AuthStorage._();

  static const _keyToken = 'access_token';
  static const _keyUser = 'cached_user';

  static Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  // ── Access Token ─────────────────────────────────────

  static Future<void> saveAccessToken(String token) async {
    final prefs = await _prefs;
    await prefs.setString(_keyToken, token);
  }

  static Future<String?> getAccessToken() async {
    final prefs = await _prefs;
    return prefs.getString(_keyToken);
  }

  // ── Cached User ───────────────────────────────────────

  static Future<void> saveUserJson(String json) async {
    final prefs = await _prefs;
    await prefs.setString(_keyUser, json);
  }

  static Future<String?> getUserJson() async {
    final prefs = await _prefs;
    return prefs.getString(_keyUser);
  }

  // ── Clear (logout) ────────────────────────────────────

  static Future<void> clear() async {
    final prefs = await _prefs;
    await prefs.remove(_keyToken);
    await prefs.remove(_keyUser);
  }
}
