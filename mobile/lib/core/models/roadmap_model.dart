/// Represents a single skill within a roadmap phase.
class SkillModel {
  final String name;
  final bool completed;

  const SkillModel({required this.name, required this.completed});

  factory SkillModel.fromJson(Map<String, dynamic> json) {
    return SkillModel(
      name: json['name'] as String? ?? '',
      completed: json['completed'] as bool? ?? false,
    );
  }

  SkillModel copyWith({bool? completed}) =>
      SkillModel(name: name, completed: completed ?? this.completed);
}

/// Represents a daily task embedded within a roadmap phase.
class RoadmapDailyTask {
  final String title;
  final String? description;
  final bool completed;

  const RoadmapDailyTask({
    required this.title,
    this.description,
    required this.completed,
  });

  factory RoadmapDailyTask.fromJson(Map<String, dynamic> json) {
    return RoadmapDailyTask(
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      completed: json['completed'] as bool? ?? false,
    );
  }
}

/// Represents a single learning resource within a roadmap phase.
class ResourceModel {
  final String title;
  final String url;
  final String type; // 'video' | 'article' | 'course' | 'documentation'
  final String platform;
  final bool isBookmarked;
  final bool isCompleted;

  const ResourceModel({
    required this.title,
    required this.url,
    required this.type,
    required this.platform,
    required this.isBookmarked,
    required this.isCompleted,
  });

  factory ResourceModel.fromJson(Map<String, dynamic> json) {
    return ResourceModel(
      title: json['title'] as String? ?? '',
      url: json['url'] as String? ?? '',
      type: json['type'] as String? ?? 'article',
      platform: json['platform'] as String? ?? '',
      isBookmarked: json['isBookmarked'] as bool? ?? false,
      isCompleted: json['isCompleted'] as bool? ?? false,
    );
  }

  ResourceModel copyWith({bool? isBookmarked, bool? isCompleted}) {
    return ResourceModel(
      title: title,
      url: url,
      type: type,
      platform: platform,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }
}

/// Represents a single phase within a roadmap.
class PhaseModel {
  final int number;
  final String title;
  final String status;
  final int? quizScore;
  final int estimatedWeeks;
  final String difficulty;
  final double completion;
  final String? summary;
  final List<SkillModel> skills;
  final List<Map<String, dynamic>> subtopics;
  final List<String> objectives;
  final List<RoadmapDailyTask> dailyTasks;
  final List<ResourceModel> resources; // added

  const PhaseModel({
    required this.number,
    required this.title,
    required this.status,
    this.quizScore,
    required this.estimatedWeeks,
    required this.difficulty,
    required this.completion,
    this.summary,
    required this.skills,
    required this.subtopics,
    required this.objectives,
    required this.dailyTasks,
    required this.resources, // added
  });

  factory PhaseModel.fromJson(Map<String, dynamic> json) {
    final skillsList = (json['skills'] as List<dynamic>? ?? [])
        .map((s) => SkillModel.fromJson(s as Map<String, dynamic>))
        .toList();

    final subtopicsList = (json['subTopics'] as List<dynamic>? ?? [])
        .map((s) => s as Map<String, dynamic>)
        .toList();

    final objectivesList = (json['objectives'] as List<dynamic>? ?? [])
        .map((o) => o.toString())
        .toList();

    final dailyTasksList = (json['dailyTasks'] as List<dynamic>? ?? [])
        .map((t) => RoadmapDailyTask.fromJson(t as Map<String, dynamic>))
        .toList();

    final resourcesList = (json['resources'] as List<dynamic>? ?? [])
        .map((r) => ResourceModel.fromJson(r as Map<String, dynamic>))
        .toList();

    return PhaseModel(
      number: (json['phaseNumber'] as num?)?.toInt() ?? 0,
      title: json['title'] as String? ?? '',
      status: json['status'] as String? ?? 'locked',
      quizScore: (json['quizScore'] as num?)?.toInt(),
      estimatedWeeks: (json['estimatedWeeks'] as num?)?.toInt() ?? 0,
      difficulty: json['difficulty'] as String? ?? 'Intermediate',
      completion: (json['completion'] as num?)?.toDouble() ?? 0.0,
      summary: json['summary'] as String?,
      skills: skillsList,
      subtopics: subtopicsList,
      objectives: objectivesList,
      dailyTasks: dailyTasksList,
      resources: resourcesList, // added
    );
  }

  PhaseModel copyWith({
    List<SkillModel>? skills,
    String? status,
    List<ResourceModel>? resources, // added
  }) {
    return PhaseModel(
      number: number,
      title: title,
      status: status ?? this.status,
      quizScore: quizScore,
      estimatedWeeks: estimatedWeeks,
      difficulty: difficulty,
      completion: completion,
      summary: summary,
      skills: skills ?? this.skills,
      subtopics: subtopics,
      objectives: objectives,
      dailyTasks: dailyTasks,
      resources: resources ?? this.resources, // added
    );
  }
}



/// Full roadmap domain model matching the server response.
class RoadmapModel {
  final String id;
  final String targetCareer;
  final String status; // 'active' | 'paused' | 'completed'
  final bool isActive;
  final double overallCompletion;
  final int activePhaseNumber;
  final String? skillLevel;
  final String? duration;
  final String? interests;
  final String? summary;
  final String? startDate;
  final String? estimatedEnd;
  final List<PhaseModel> phases;

  const RoadmapModel({
    required this.id,
    required this.targetCareer,
    required this.status,
    required this.isActive,
    required this.overallCompletion,
    required this.activePhaseNumber,
    this.skillLevel,
    this.duration,
    this.interests,
    this.summary,
    this.startDate,
    this.estimatedEnd,
    required this.phases,
  });

  int get totalPhases => phases.length;

  factory RoadmapModel.fromJson(Map<String, dynamic> json) {
    final phasesList = (json['phases'] as List<dynamic>? ?? [])
        .map((p) => PhaseModel.fromJson(p as Map<String, dynamic>))
        .toList();

    return RoadmapModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      targetCareer: json['targetCareer'] as String? ?? '',
      status: json['status'] as String? ?? 'active',
      isActive: json['isActive'] as bool? ?? true,
      overallCompletion:
          (json['overallCompletion'] as num?)?.toDouble() ?? 0.0,
      activePhaseNumber: (json['activePhaseNumber'] as num?)?.toInt() ?? 1,
      skillLevel: json['skillLevel'] as String?,
      duration: json['duration'] as String?,
      interests: json['interests'] as String?,
      summary: json['summary'] as String?,
      startDate: json['startDate'] as String?,
      estimatedEnd: json['estimatedEnd'] as String?,
      phases: phasesList,
    );
  }

  RoadmapModel copyWith({List<PhaseModel>? phases, double? overallCompletion}) {
    return RoadmapModel(
      id: id,
      targetCareer: targetCareer,
      status: status,
      isActive: isActive,
      overallCompletion: overallCompletion ?? this.overallCompletion,
      activePhaseNumber: activePhaseNumber,
      skillLevel: skillLevel,
      duration: duration,
      interests: interests,
      summary: summary,
      startDate: startDate,
      estimatedEnd: estimatedEnd,
      phases: phases ?? this.phases,
    );
  }
}
