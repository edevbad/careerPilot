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
    int toInt(dynamic v) => (v as num?)?.toInt() ?? 0;
    double toDouble(dynamic v) => (v as num?)?.toDouble() ?? 0.0;

    return ProgressSummaryModel(
      totalXp: toInt(json['totalXp'] ?? json['xp']),
      streak: toInt(json['streak']),
      longestStreak: toInt(json['longestStreak']),
      tasksCompleted: toInt(json['tasksCompleted']),
      quizzesPassed: toInt(json['quizzesPassed']),
      roadmapsGenerated: toInt(json['roadmapsGenerated']),
      overallCompletion: toDouble(json['overallCompletion']),
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
