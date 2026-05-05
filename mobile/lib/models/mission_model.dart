class MissionModel {
  final int id;
  final String title;
  final String description;
  final int pointsReward;
  final DateTime? deadline;
  final bool isCompleted;
  final double progress;

  const MissionModel({
    required this.id,
    required this.title,
    required this.description,
    required this.pointsReward,
    required this.deadline,
    required this.isCompleted,
    required this.progress,
  });

  factory MissionModel.fromJson(Map<String, dynamic> json) {
    final parsedProgress = (json['progress'] as num?)?.toDouble() ?? 0;
    final targetValue = (json['target_value'] as num?)?.toDouble() ?? 0;
    final userProgress = (json['user_progress'] as num?)?.toDouble() ?? 0;
    final normalized = targetValue > 0
        ? (userProgress / targetValue)
        : parsedProgress;

    return MissionModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      pointsReward:
          (json['points_reward'] as num?)?.toInt() ??
          (json['pointsReward'] as num?)?.toInt() ??
          0,
      deadline: _parseDate(json['deadline'] ?? json['created_at']),
      isCompleted:
          json['is_completed'] as bool? ??
          json['isCompleted'] as bool? ??
          false,
      progress: normalized.clamp(0, 1),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'points_reward': pointsReward,
      'deadline': deadline?.toIso8601String(),
      'is_completed': isCompleted,
      'progress': progress,
    };
  }

  MissionModel copyWith({
    int? id,
    String? title,
    String? description,
    int? pointsReward,
    DateTime? deadline,
    bool? isCompleted,
    double? progress,
  }) {
    return MissionModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      pointsReward: pointsReward ?? this.pointsReward,
      deadline: deadline ?? this.deadline,
      isCompleted: isCompleted ?? this.isCompleted,
      progress: (progress ?? this.progress).clamp(0, 1),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) {
      return null;
    }
    return DateTime.tryParse(value.toString());
  }
}
