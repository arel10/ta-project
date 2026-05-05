enum DepositStatus { pending, verified, rejected }

class DepositModel {
  final int id;
  final int userId;
  final String wasteType;
  final String wasteLabel;
  final double weightKg;
  final int pointsEarned;
  final DepositStatus status;
  final DateTime? createdAt;

  const DepositModel({
    required this.id,
    required this.userId,
    required this.wasteType,
    required this.wasteLabel,
    required this.weightKg,
    required this.pointsEarned,
    required this.status,
    required this.createdAt,
  });

  factory DepositModel.fromJson(Map<String, dynamic> json) {
    return DepositModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      userId:
          (json['user_id'] as num?)?.toInt() ??
          (json['userId'] as num?)?.toInt() ??
          0,
      wasteType:
          json['waste_type']?.toString() ?? json['wasteType']?.toString() ?? '',
      wasteLabel:
          json['waste_label']?.toString() ??
          json['wasteLabel']?.toString() ??
          '',
      weightKg:
          (json['weight_kg'] as num?)?.toDouble() ??
          (json['weightKg'] as num?)?.toDouble() ??
          0,
      pointsEarned:
          (json['points_earned'] as num?)?.toInt() ??
          (json['pointsEarned'] as num?)?.toInt() ??
          0,
      status: _statusFromValue(json['status']?.toString() ?? ''),
      createdAt: _parseDate(json['created_at'] ?? json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'waste_type': wasteType,
      'waste_label': wasteLabel,
      'weight_kg': weightKg,
      'points_earned': pointsEarned,
      'status': status.name,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  DepositModel copyWith({
    int? id,
    int? userId,
    String? wasteType,
    String? wasteLabel,
    double? weightKg,
    int? pointsEarned,
    DepositStatus? status,
    DateTime? createdAt,
  }) {
    return DepositModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      wasteType: wasteType ?? this.wasteType,
      wasteLabel: wasteLabel ?? this.wasteLabel,
      weightKg: weightKg ?? this.weightKg,
      pointsEarned: pointsEarned ?? this.pointsEarned,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  static DepositStatus _statusFromValue(String raw) {
    switch (raw.toLowerCase()) {
      case 'validated':
      case 'verified':
      case 'tervalidasi':
        return DepositStatus.verified;
      case 'rejected':
      case 'ditolak':
        return DepositStatus.rejected;
      default:
        return DepositStatus.pending;
    }
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) {
      return null;
    }
    return DateTime.tryParse(value.toString());
  }
}
