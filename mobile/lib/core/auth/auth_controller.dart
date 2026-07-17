import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../repositories/auth_repository.dart';
import '../storage/auth_storage.dart';

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
      final cachedUser = await AuthStorage.getUserJson();
      if (cachedUser != null) {
        _currentUser = UserModel.fromJsonString(cachedUser);
        notifyListeners();
      }
      
      // Silently try refresh-token to see if session is still valid
      final authResponse = await _authRepository.refreshToken();
      _currentUser = authResponse.user;
    } catch (_) {
      // If error occurs, keep cached user as guest or clear if needed.
      // API client automatically clears stored token on 401.
      _currentUser = null;
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
}
