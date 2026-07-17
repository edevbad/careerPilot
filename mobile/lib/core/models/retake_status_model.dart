/// Retake eligibility returned by GET /quizzes/:roadmapId/phase/:phaseNumber/retake-status.
class RetakeStatusModel {
  final bool canTake;
  final String? reason; // 'cooldown' | 'not_started' | null
  final String? message;
  final String? retakeAvailableAt;
  final int? minutesRemaining;
  final int attemptCount;
  final int? lastScore;
  final List<String> studySuggestions;

  const RetakeStatusModel({
    required this.canTake,
    this.reason,
    this.message,
    this.retakeAvailableAt,
    this.minutesRemaining,
    required this.attemptCount,
    this.lastScore,
    required this.studySuggestions,
  });

  /// Maps server retake status to the quiz hub UI status string.
  String get uiStatus {
    if (canTake && attemptCount == 0) return 'ready';
    if (canTake) return 'ready';
    if (reason == 'cooldown') return 'cooldown';
    return 'locked';
  }

  factory RetakeStatusModel.fromJson(Map<String, dynamic> json) {
    return RetakeStatusModel(
      canTake: json['canTake'] as bool? ?? false,
      reason: json['reason'] as String?,
      message: json['message'] as String?,
      retakeAvailableAt: json['retakeAvailableAt'] as String?,
      minutesRemaining: json['minutesRemaining'] as int?,
      attemptCount: json['attemptCount'] as int? ?? 0,
      lastScore: json['lastScore'] as int?,
      studySuggestions: (json['studySuggestions'] as List<dynamic>? ?? [])
          .map((s) => s.toString())
          .toList(),
    );
  }
}
