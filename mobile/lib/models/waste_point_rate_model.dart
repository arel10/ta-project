class WastePointRateModel {
  final int id;
  final String code;
  final String name;
  final String category;
  final int pointsPerKg;
  final bool isActive;
  final int sortOrder;

  const WastePointRateModel({
    required this.id,
    required this.code,
    required this.name,
    required this.category,
    required this.pointsPerKg,
    required this.isActive,
    required this.sortOrder,
  });

  String get displayLabel => '$code - $name';

  factory WastePointRateModel.fromJson(Map<String, dynamic> json) {
    return WastePointRateModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      category: json['category']?.toString() ?? 'lainnya',
      pointsPerKg:
          (json['points_per_kg'] as num?)?.toInt() ??
          (json['pointsPerKg'] as num?)?.toInt() ??
          0,
      isActive: json['is_active'] == null ? true : json['is_active'] == true,
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
    );
  }
}
