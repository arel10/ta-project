class UserModel {
  final int id;
  final String name;
  final String email;
  final String phone;
  final String accountNumber;
  final String gender;
  final String nik;
  final String ktpImageUrl;
  final String address;
  final String department;
  final String status;
  final int points;
  final String level;
  final DateTime? joinedAt;
  final bool willChurn;
  final double? churnProbability;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.accountNumber,
    required this.gender,
    required this.nik,
    required this.ktpImageUrl,
    required this.address,
    required this.department,
    required this.status,
    required this.points,
    required this.level,
    required this.joinedAt,
    required this.willChurn,
    this.churnProbability,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      accountNumber: json['account_number']?.toString() ?? '',
      gender: json['gender']?.toString() ?? '',
      nik: json['nik']?.toString() ?? '',
      ktpImageUrl: json['ktp_image_url']?.toString() ?? json['ktpImageUrl']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      department: json['department']?.toString() ?? '',
      status: json['status']?.toString() ?? 'approved',
      points:
          (json['total_points'] as num?)?.toInt() ??
          (json['points'] as num?)?.toInt() ??
          0,
      level: json['level']?.toString() ?? '',
      joinedAt: _parseDate(
        json['created_at'] ?? json['joined_at'] ?? json['joinedAt'],
      ),
      willChurn: json['will_churn'] as bool? ?? (json['willChurn'] as bool? ?? false),
      churnProbability: (json['churn_probability'] as num?)?.toDouble() ?? (json['churnProbability'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'account_number': accountNumber,
      'gender': gender,
      'nik': nik,
      'ktp_image_url': ktpImageUrl,
      'address': address,
      'department': department,
      'status': status,
      'total_points': points,
      'level': level,
      'created_at': joinedAt?.toIso8601String(),
      'will_churn': willChurn,
      'churn_probability': churnProbability,
    };
  }

  UserModel copyWith({
    int? id,
    String? name,
    String? email,
    String? phone,
    String? accountNumber,
    String? gender,
    String? nik,
    String? ktpImageUrl,
    String? address,
    String? department,
    String? status,
    int? points,
    String? level,
    DateTime? joinedAt,
    bool? willChurn,
    double? churnProbability,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      accountNumber: accountNumber ?? this.accountNumber,
      gender: gender ?? this.gender,
      nik: nik ?? this.nik,
      ktpImageUrl: ktpImageUrl ?? this.ktpImageUrl,
      address: address ?? this.address,
      department: department ?? this.department,
      status: status ?? this.status,
      points: points ?? this.points,
      level: level ?? this.level,
      joinedAt: joinedAt ?? this.joinedAt,
      willChurn: willChurn ?? this.willChurn,
      churnProbability: churnProbability ?? this.churnProbability,
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) {
      return null;
    }
    return DateTime.tryParse(value.toString());
  }
}
