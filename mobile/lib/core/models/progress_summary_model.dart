/// Aggregated progress summary returned by GET /progress/summary
class ProgressSummaryModel {
  final int totalXp;
  final int streak;
  final int longestStreak;
  final int tasksCompleted;
  final int quizzesPassed;
  final int roadmapsGenerated;
  final double overallCompletion;

  const ProgressSummaryModel({
    required this.totalXp,
    required this.streak,
    required this.longestStreak,
    required this.tasksCompleted,
    required this.quizzesPassed,
    required this.roadmapsGenerated,
    required this.overallCompletion,
  });

  factory ProgressSummaryModel.fromJson(Map<String, dynamic> json) {
    return ProgressSummaryModel(
      totalXp: json['totalXp'] as int? ?? json['xp'] as int? ?? 0,
      streak: json['streak'] as int? ?? 0,
      longestStreak: json['longestStreak'] as int? ?? 0,
      tasksCompleted: json['tasksCompleted'] as int? ?? 0,
      quizzesPassed: json['quizzesPassed'] as int? ?? 0,
      roadmapsGenerated: json['roadmapsGenerated'] as int? ?? 0,
      overallCompletion:
          (json['overallCompletion'] as num?)?.toDouble() ?? 0.0,
    );
  }

  static ProgressSummaryModel empty() => const ProgressSummaryModel(
        totalXp: 0,
        streak: 0,
        longestStreak: 0,
        tasksCompleted: 0,
        quizzesPassed: 0,
        roadmapsGenerated: 0,
        overallCompletion: 0,
      );
}
