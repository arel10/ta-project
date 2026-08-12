import 'package:sirkula/models/reward_model.dart';

enum RedemptionStatus { pending, approved, rejected }

class RedemptionModel {
  final int id;
  final int userId;
  final int rewardId;
  final int pointsSpent;
  final RedemptionStatus status;
  final String? rejectionReason;
  final String redemptionCode;
  final DateTime? createdAt;
  final RewardModel? reward;

  const RedemptionModel({
    required this.id,
    required this.userId,
    required this.rewardId,
    required this.pointsSpent,
    required this.status,
    this.rejectionReason,
    required this.redemptionCode,
    this.createdAt,
    this.reward,
  });

  factory RedemptionModel.fromJson(Map<String, dynamic> json) {
    final statusStr = json['status']?.toString().toLowerCase() ?? 'pending';
    final statusEnum = switch (statusStr) {
      'approved' => RedemptionStatus.approved,
      'rejected' => RedemptionStatus.rejected,
      _ => RedemptionStatus.pending,
    };

    RewardModel? rewardObj;
    if (json['reward'] is Map<String, dynamic>) {
      rewardObj = RewardModel.fromJson(json['reward'] as Map<String, dynamic>);
    }

    return RedemptionModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      userId: (json['user_id'] as num?)?.toInt() ?? 0,
      rewardId: (json['reward_id'] as num?)?.toInt() ?? 0,
      pointsSpent: (json['points_spent'] as num?)?.toInt() ?? 0,
      status: statusEnum,
      rejectionReason: json['rejection_reason']?.toString(),
      redemptionCode: json['redemption_code']?.toString() ?? '',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      reward: rewardObj,
    );
  }
}
