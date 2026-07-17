/// A daily task returned by GET /tasks/today or PATCH /tasks/:id/complete|skip.
class TaskModel {
  final String id;
  final String userId;
  final String roadmapId;
  final int? phaseNumber;
  final String taskType; // 'reading' | 'video' | 'coding' | 'project'
  final String title;
  final String? description;
  final String? resourceUrl;
  final int estimatedMinutes;
  final int xpReward;
  final String status; // 'pending' | 'completed' | 'skipped'
  final String? skipReason;
  final String? assignedDate;
  final String? completedAt;

  const TaskModel({
    required this.id,
    required this.userId,
    required this.roadmapId,
    this.phaseNumber,
    required this.taskType,
    required this.title,
    this.description,
    this.resourceUrl,
    required this.estimatedMinutes,
    required this.xpReward,
    required this.status,
    this.skipReason,
    this.assignedDate,
    this.completedAt,
  });

  bool get isCompleted => status == 'completed';
  bool get isSkipped => status == 'skipped';
  bool get isPending => status == 'pending';

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['_id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      roadmapId: json['roadmapId'] as String? ?? '',
      phaseNumber: json['phaseNumber'] as int?,
      taskType: json['taskType'] as String? ?? 'reading',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      resourceUrl: json['resourceUrl'] as String?,
      estimatedMinutes: json['estimatedMinutes'] as int? ?? 0,
      xpReward: json['xpReward'] as int? ?? 0,
      status: json['status'] as String? ?? 'pending',
      skipReason: json['skipReason'] as String?,
      assignedDate: json['assignedDate'] as String?,
      completedAt: json['completedAt'] as String?,
    );
  }

  TaskModel copyWith({String? status, String? skipReason, String? completedAt}) {
    return TaskModel(
      id: id,
      userId: userId,
      roadmapId: roadmapId,
      phaseNumber: phaseNumber,
      taskType: taskType,
      title: title,
      description: description,
      resourceUrl: resourceUrl,
      estimatedMinutes: estimatedMinutes,
      xpReward: xpReward,
      status: status ?? this.status,
      skipReason: skipReason ?? this.skipReason,
      assignedDate: assignedDate,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}

/// Summary counts returned alongside tasks in GET /tasks/today
class TaskSummaryModel {
  final int total;
  final int completed;
  final int skipped;
  final int pending;
  final int xpEarned;

  const TaskSummaryModel({
    required this.total,
    required this.completed,
    required this.skipped,
    required this.pending,
    required this.xpEarned,
  });

  factory TaskSummaryModel.fromJson(Map<String, dynamic> json) {
    return TaskSummaryModel(
      total: json['total'] as int? ?? 0,
      completed: json['completed'] as int? ?? 0,
      skipped: json['skipped'] as int? ?? 0,
      pending: json['pending'] as int? ?? 0,
      xpEarned: json['xpEarned'] as int? ?? 0,
    );
  }

  static TaskSummaryModel empty() =>
      const TaskSummaryModel(total: 0, completed: 0, skipped: 0, pending: 0, xpEarned: 0);
}
