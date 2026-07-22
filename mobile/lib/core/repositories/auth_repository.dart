import 'package:dio/dio.dart';
import '../models/auth_response_model.dart';
import '../models/user_model.dart';
import '../network/api_client.dart';
import '../network/app_exception.dart';
import '../storage/auth_storage.dart';

class AuthRepository {
  final Dio _dio = ApiClient.instance.dio;

  Future<AuthResponseModel> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      final authResponse = AuthResponseModel.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
      await AuthStorage.saveAccessToken(authResponse.accessToken);
      await AuthStorage.saveUserJson(authResponse.user.toJsonString());
      return authResponse;
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Login failed';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<AuthResponseModel> register(
    String name,
    String email,
    String password,
    String confirmPassword, {
    String role = 'user',
  }) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'role': role,
      });
      final authResponse = AuthResponseModel.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
      await AuthStorage.saveAccessToken(authResponse.accessToken);
      await AuthStorage.saveUserJson(authResponse.user.toJsonString());
      return authResponse;
    } on DioException catch (e) {
      String msg = 'Something went wrong';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String && data.isNotEmpty) {
        msg = 'Server error (${e.response?.statusCode})';
      }
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  /// Refresh the access token using the httpOnly refreshToken cookie.
  /// Uses an isolated Dio (via [ApiClient.createRefreshDio]) to avoid
  /// triggering the main dio's 401 interceptor and causing an infinite loop.
  Future<AuthResponseModel> refreshToken() async {
    try {
      // Use the isolated refresh Dio — no auth interceptor, but has cookie jar
      final refreshDio = ApiClient.instance.createRefreshDio();
      final response = await refreshDio.post('/auth/refresh-token');
      final authResponse = AuthResponseModel.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
      await AuthStorage.saveAccessToken(authResponse.accessToken);
      await AuthStorage.saveUserJson(authResponse.user.toJsonString());
      return authResponse;
    } on DioException catch (e) {
      String msg = 'Something went wrong';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String && data.isNotEmpty) {
        msg = 'Server error (${e.response?.statusCode})';
      }
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } finally {
      await AuthStorage.clear();
      await ApiClient.instance.clearCookies();
    }
  }

  Future<UserModel> getProfile() async {
    try {
      final response = await _dio.get('/auth/profile');
      final user = UserModel.fromJson(
        response.data['data']['user'] as Map<String, dynamic>,
      );
      await AuthStorage.saveUserJson(user.toJsonString());
      return user;
    } on DioException catch (e) {
      String msg = 'Something went wrong';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String && data.isNotEmpty) {
        msg = 'Server error (${e.response?.statusCode})';
      }
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<UserModel> updateProfile({String? name, String? careerGoal}) async {
    try {
      final response = await _dio.put('/auth/profile', data: {
        if (name != null) 'name': name,
        if (careerGoal != null) 'careerGoal': careerGoal,
      });
      final user = UserModel.fromJson(
        response.data['data']['user'] as Map<String, dynamic>,
      );
      await AuthStorage.saveUserJson(user.toJsonString());
      return user;
    } on DioException catch (e) {
      String msg = 'Something went wrong';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String && data.isNotEmpty) {
        msg = 'Server error (${e.response?.statusCode})';
      }
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }
}
