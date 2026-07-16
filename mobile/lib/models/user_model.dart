class UserModel {
  final int id;
  final String name;
  final String email;
  final String accountNumber;
  final String gender;
  final String nik;
  final String address;
  final String department;
  final int points;
  final String level;
  final DateTime? joinedAt;
  final String riskLevel;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.accountNumber,
    required this.gender,
    required this.nik,
    required this.address,
    required this.department,
    required this.points,
    required this.level,
    required this.joinedAt,
    required this.riskLevel,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      accountNumber: json['account_number']?.toString() ?? '',
      gender: json['gender']?.toString() ?? '',
      nik: json['nik']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      department: json['department']?.toString() ?? '',
      points:
          (json['total_points'] as num?)?.toInt() ??
          (json['points'] as num?)?.toInt() ??
          0,
      level: json['level']?.toString() ?? '',
      joinedAt: _parseDate(
        json['created_at'] ?? json['joined_at'] ?? json['joinedAt'],
      ),
      riskLevel: json['risk_level']?.toString() ?? 'low',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'account_number': accountNumber,
      'gender': gender,
      'nik': nik,
      'address': address,
      'department': department,
      'total_points': points,
      'level': level,
      'created_at': joinedAt?.toIso8601String(),
      'risk_level': riskLevel,
    };
  }

  UserModel copyWith({
    int? id,
    String? name,
    String? email,
    String? accountNumber,
    String? gender,
    String? nik,
    String? address,
    String? department,
    int? points,
    String? level,
    DateTime? joinedAt,
    String? riskLevel,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      accountNumber: accountNumber ?? this.accountNumber,
      gender: gender ?? this.gender,
      nik: nik ?? this.nik,
      address: address ?? this.address,
      department: department ?? this.department,
      points: points ?? this.points,
      level: level ?? this.level,
      joinedAt: joinedAt ?? this.joinedAt,
      riskLevel: riskLevel ?? this.riskLevel,
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) {
      return null;
    }
    return DateTime.tryParse(value.toString());
  }
}
