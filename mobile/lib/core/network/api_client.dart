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

  static const String baseUrl = 'http://localhost:5000/api';

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
            // Attempt silent token refresh
            try {
              final refreshDio = Dio(BaseOptions(
                baseUrl: baseUrl,
                headers: {'Content-Type': 'application/json'},
              ));
              refreshDio.interceptors.add(CookieManager(_cookieJar));

              final refreshResponse = await refreshDio.post('/auth/refresh-token');
              final newToken =
                  refreshResponse.data['data']['accessToken'] as String?;
              if (newToken != null) {
                await AuthStorage.saveAccessToken(newToken);
                // Retry original request with new token
                err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
                final retryResponse = await dio.fetch(err.requestOptions);
                return handler.resolve(retryResponse);
              }
            } catch (_) {
              // Refresh failed — clear stored credentials
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
}
