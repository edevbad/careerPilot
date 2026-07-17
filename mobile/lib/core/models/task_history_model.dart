/// Task completion history entry returned by GET /tasks/history
class TaskHistoryModel {
  final String date;
  final int totalTasks;
  final int completedTasks;
  final int skippedTasks;
  final int pendingTasks;
  final int xpEarned;
  final String status; // 'completed' | 'partial' | 'pending' | 'none'

  const TaskHistoryModel({
    required this.date,
    required this.totalTasks,
    required this.completedTasks,
    required this.skippedTasks,
    required this.pendingTasks,
    required this.xpEarned,
    required this.status,
  });

  factory TaskHistoryModel.fromJson(Map<String, dynamic> json) {
    return TaskHistoryModel(
      date: json['date'] as String? ?? '',
      totalTasks: json['totalTasks'] as int? ?? 0,
      completedTasks: json['completedTasks'] as int? ?? 0,
      skippedTasks: json['skippedTasks'] as int? ?? 0,
      pendingTasks: json['pendingTasks'] as int? ?? 0,
      xpEarned: json['xpEarned'] as int? ?? 0,
      status: json['status'] as String? ?? 'pending',
    );
  }
}
