/// A single quiz question as returned by GET /quizzes/:roadmapId/phase/:phaseNumber.
/// Note: correct answers are NOT included in this response (server-side grading).
class QuizQuestionModel {
  final int id;
  final String questionType; // 'mcq' | 'truefalse'
  final String questionText;
  final List<String> options; // Empty for truefalse

  const QuizQuestionModel({
    required this.id,
    required this.questionType,
    required this.questionText,
    required this.options,
  });

  bool get isTrueFalse => questionType == 'truefalse';
  bool get isMcq => questionType == 'mcq';

  factory QuizQuestionModel.fromJson(Map<String, dynamic> json) {
    return QuizQuestionModel(
      id: json['id'] as int? ?? 0,
      questionType: json['questionType'] as String? ?? 'mcq',
      questionText: json['questionText'] as String? ?? '',
      options: (json['options'] as List<dynamic>? ?? [])
          .map((o) => o.toString())
          .toList(),
    );
  }
}

/// Full quiz session returned by GET /quizzes/:roadmapId/phase/:phaseNumber.
class QuizSessionModel {
  final String roadmapId;
  final int phaseNumber;
  final String phaseTitle;
  final int passingScore;
  final int totalQuestions;
  final int attemptNumber;
  final List<QuizQuestionModel> questions;
  final String startedAt;

  const QuizSessionModel({
    required this.roadmapId,
    required this.phaseNumber,
    required this.phaseTitle,
    required this.passingScore,
    required this.totalQuestions,
    required this.attemptNumber,
    required this.questions,
    required this.startedAt,
  });

  factory QuizSessionModel.fromJson(Map<String, dynamic> json) {
    return QuizSessionModel(
      roadmapId: json['roadmapId'] as String? ?? '',
      phaseNumber: json['phaseNumber'] as int? ?? 0,
      phaseTitle: json['phaseTitle'] as String? ?? '',
      passingScore: json['passingScore'] as int? ?? 70,
      totalQuestions: json['totalQuestions'] as int? ?? 0,
      attemptNumber: json['attemptNumber'] as int? ?? 1,
      questions: (json['questions'] as List<dynamic>? ?? [])
          .map((q) => QuizQuestionModel.fromJson(q as Map<String, dynamic>))
          .toList(),
      startedAt: json['startedAt'] as String? ?? DateTime.now().toIso8601String(),
    );
  }
}

/// Result returned after POST /quizzes/:roadmapId/phase/:phaseNumber/submit.
class QuizResultModel {
  final bool passed;
  final int score;
  final int correctAnswers;
  final int totalQuestions;
  final int passingScore;
  final bool nextPhaseUnlocked;
  final int activePhaseNumber;
  final String durationFormatted;
  final List<String> studySuggestions;

  const QuizResultModel({
    required this.passed,
    required this.score,
    required this.correctAnswers,
    required this.totalQuestions,
    required this.passingScore,
    required this.nextPhaseUnlocked,
    required this.activePhaseNumber,
    required this.durationFormatted,
    required this.studySuggestions,
  });

  factory QuizResultModel.fromJson(Map<String, dynamic> json) {
    return QuizResultModel(
      passed: json['passed'] as bool? ?? false,
      score: json['score'] as int? ?? 0,
      correctAnswers: json['correctAnswers'] as int? ?? 0,
      totalQuestions: json['totalQuestions'] as int? ?? 0,
      passingScore: json['passingScore'] as int? ?? 70,
      nextPhaseUnlocked: json['nextPhaseUnlocked'] as bool? ?? false,
      activePhaseNumber: json['activePhaseNumber'] as int? ?? 1,
      durationFormatted: json['durationFormatted'] as String? ?? '',
      studySuggestions: (json['studySuggestions'] as List<dynamic>? ?? [])
          .map((s) => s.toString())
          .toList(),
    );
  }
}

/// A single past attempt from GET /quizzes/:roadmapId/phase/:phaseNumber/results.
class QuizAttemptModel {
  final String id;
  final int attemptNumber;
  final int totalQuestions;
  final int correctAnswers;
  final int score;
  final int passingScore;
  final bool passed;
  final String? startedAt;
  final String? completedAt;

  const QuizAttemptModel({
    required this.id,
    required this.attemptNumber,
    required this.totalQuestions,
    required this.correctAnswers,
    required this.score,
    required this.passingScore,
    required this.passed,
    this.startedAt,
    this.completedAt,
  });

  factory QuizAttemptModel.fromJson(Map<String, dynamic> json) {
    return QuizAttemptModel(
      id: json['_id'] as String? ?? '',
      attemptNumber: json['attemptNumber'] as int? ?? 0,
      totalQuestions: json['totalQuestions'] as int? ?? 0,
      correctAnswers: json['correctAnswers'] as int? ?? 0,
      score: json['score'] as int? ?? 0,
      passingScore: json['passingScore'] as int? ?? 70,
      passed: json['passed'] as bool? ?? false,
      startedAt: json['startedAt'] as String?,
      completedAt: json['completedAt'] as String?,
    );
  }
}

/// Response from GET /quizzes/:roadmapId/phase/:phaseNumber/results
class QuizResultsResponse {
  final int phaseNumber;
  final String phaseTitle;
  final int passingScore;
  final int totalAttempts;
  final bool hasPassed;
  final int? bestScore;
  final bool canRetake;
  final String? retakeAvailableAt;
  final List<QuizAttemptModel> attempts;

  const QuizResultsResponse({
    required this.phaseNumber,
    required this.phaseTitle,
    required this.passingScore,
    required this.totalAttempts,
    required this.hasPassed,
    this.bestScore,
    required this.canRetake,
    this.retakeAvailableAt,
    required this.attempts,
  });

  factory QuizResultsResponse.fromJson(Map<String, dynamic> json) {
    return QuizResultsResponse(
      phaseNumber: json['phaseNumber'] as int? ?? 0,
      phaseTitle: json['phaseTitle'] as String? ?? '',
      passingScore: json['passingScore'] as int? ?? 70,
      totalAttempts: json['totalAttempts'] as int? ?? 0,
      hasPassed: json['hasPassed'] as bool? ?? false,
      bestScore: json['bestScore'] as int?,
      canRetake: json['canRetake'] as bool? ?? true,
      retakeAvailableAt: json['retakeAvailableAt'] as String?,
      attempts: (json['attempts'] as List<dynamic>? ?? [])
          .map((a) => QuizAttemptModel.fromJson(a as Map<String, dynamic>))
          .toList(),
    );
  }
}
