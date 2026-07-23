import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../repositories/auth_repository.dart';
import '../storage/auth_storage.dart';
import '../network/app_exception.dart';

class AuthController extends ChangeNotifier {
  AuthController._();
  static final AuthController instance = AuthController._();

  final AuthRepository _authRepository = AuthRepository();
  UserModel? _currentUser;
  bool _initialized = false;

  UserModel? get currentUser => _currentUser;
  bool get isInitialized => _initialized;
  bool get isLoggedIn => _currentUser != null;

  Future<void> initialize() async {
    if (_initialized) return;
    try {
      // 1. Restore cached user immediately so splash can navigate
      final cachedUser = await AuthStorage.getUserJson();
      if (cachedUser != null) {
        _currentUser = UserModel.fromJsonString(cachedUser);
        notifyListeners();
      }

      // 2. Silently refresh session to get a fresh token
      final authResponse = await _authRepository.refreshToken();
      _currentUser = authResponse.user;
    } on ApiException catch (e) {
      // Only clear the session for true auth failures (401/403)
      if (e.statusCode == 401 || e.statusCode == 403) {
        _currentUser = null;
        await AuthStorage.clear();
      }
      // For any other API error (500, etc.) or network error, keep cached user
    } catch (_) {
      // Network/timeout errors — keep cached user, app can still work offline
    } finally {
      _initialized = true;
      notifyListeners();
    }
  }

  Future<void> updateCurrentUser(UserModel user) async {
    _currentUser = user;
    await AuthStorage.saveUserJson(user.toJsonString());
    notifyListeners();
  }

  void setCurrentUser(UserModel? user) {
    _currentUser = user;
    notifyListeners();
  }

  Future<void> logout() async {
    _currentUser = null;
    await AuthStorage.clear();
    notifyListeners();
  }
}
