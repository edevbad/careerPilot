import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';
import '../storage/auth_storage.dart';
import 'app_exception.dart';

/// Singleton Dio client pre-configured with:
/// - Base URL + JSON headers
/// - Cookie jar for refresh-token cookie persistence
/// - Auth interceptor (injects Bearer token, handles 401 refresh)
/// - Logging interceptor
class ApiClient {
  ApiClient._();
  static final ApiClient _instance = ApiClient._();
  static ApiClient get instance => _instance;

  late final Dio dio;
  late final PersistCookieJar _cookieJar;

  static const String baseUrl = 'https://careerpilot-server.onrender.com/api';
  // static const String baseUrl = 'http://172.20.36.199:5000/api';

  Future<void> init() async {
    final appDir = await getApplicationDocumentsDirectory();
    _cookieJar = PersistCookieJar(
      storage: FileStorage('${appDir.path}/.cookies/'),
    );

    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    // Persist refresh-token cookie across requests
    dio.interceptors.add(CookieManager(_cookieJar));

    // Auth interceptor
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await AuthStorage.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (err, handler) async {
          if (err.response?.statusCode == 401) {
            // Attempt silent token refresh using an isolated Dio with the cookie jar
            // CRITICAL: Do NOT use the main `dio` here — that would cause infinite 401 loops.
            try {
              final refreshDio = createRefreshDio();
              final refreshResponse = await refreshDio.post('/auth/refresh-token');
              final data = refreshResponse.data['data'] as Map<String, dynamic>?;
              final newToken = data?['accessToken'] as String?;

              if (newToken != null) {
                await AuthStorage.saveAccessToken(newToken);

                // Also persist the updated user JSON if present
                if (data?['user'] != null) {
                  await AuthStorage.saveUserJson(jsonEncode(data!['user']));
                }

                // Retry the original request with the new token
                err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
                final retryResponse = await dio.fetch(err.requestOptions);
                return handler.resolve(retryResponse);
              }
            } catch (_) {
              // Refresh failed — clear stored credentials so the app redirects to login
              await AuthStorage.clear();
            }
          }
          return handler.next(err);
        },
      ),
    );

    // Debug logging
    dio.interceptors.add(LogInterceptor(
      request: true,
      requestBody: true,
      responseBody: true,
      error: true,
      logPrint: (obj) => debugLog(obj.toString()),
    ));
  }

  void debugLog(String message) {
    // ignore: avoid_print
    print('[ApiClient] $message');
  }

  /// Clears all stored cookies (called on logout)
  Future<void> clearCookies() async {
    await _cookieJar.deleteAll();
  }

  /// Returns a fresh isolated Dio with the cookie jar but NO auth interceptor.
  /// Use this for token-refresh calls to avoid infinite 401 retry loops.
  Dio createRefreshDio() {
    final refreshDio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    // CRITICAL: add the PersistCookieJar so the refreshToken cookie is sent
    refreshDio.interceptors.add(CookieManager(_cookieJar));
    return refreshDio;
  }
}
