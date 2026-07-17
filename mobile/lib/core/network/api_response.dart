/// Typed wrapper for the standard API envelope:
/// { "statusCode": 200, "success": true, "message": "...", "data": {...} }
class ApiResponse<T> {
  final int statusCode;
  final bool success;
  final String message;
  final T? data;

  const ApiResponse({
    required this.statusCode,
    required this.success,
    required this.message,
    this.data,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromData,
  ) {
    return ApiResponse<T>(
      statusCode: json['statusCode'] as int? ?? 0,
      success: json['success'] as bool? ?? false,
      message: json['message'] as String? ?? '',
      data: fromData != null && json['data'] != null
          ? fromData(json['data'])
          : null,
    );
  }
}
