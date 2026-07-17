/// Base class for all application exceptions thrown from the network/repository layer.
sealed class AppException implements Exception {
  final String message;
  const AppException(this.message);

  @override
  String toString() => message;
}

/// Server returned a non-2xx status code with a message.
class ApiException extends AppException {
  final int statusCode;
  const ApiException(this.statusCode, super.message);
}

/// 401 Unauthorized — session expired and refresh failed.
class AuthException extends AppException {
  const AuthException([super.message = 'Session expired. Please log in again.']);
}

/// Network connectivity issue (no internet, timeout, DNS failure).
class NetworkException extends AppException {
  const NetworkException([super.message = 'Network error. Check your connection.']);
}

/// Server returned 5xx or an unexpected error.
class ServerException extends AppException {
  const ServerException([super.message = 'Server error. Please try again later.']);
}

/// Helper: convert a Dio error into a typed [AppException].
AppException parseException(Object error) {
  // Avoid importing dio here — caller passes the message/status they need
  if (error is AppException) return error;
  return NetworkException(error.toString());
}
