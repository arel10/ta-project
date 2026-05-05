import 'package:sirkula/core/constants.dart';

class RewardModel {
  final int id;
  final String name;
  final String description;
  final int pointsCost;
  final int stock;
  final String imageUrl;
  final String category;

  const RewardModel({
    required this.id,
    required this.name,
    required this.description,
    required this.pointsCost,
    required this.stock,
    required this.imageUrl,
    required this.category,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) {
    final rawImageUrl =
        json['image_url']?.toString() ?? json['imageUrl']?.toString() ?? '';

    return RewardModel(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      pointsCost:
          (json['points_cost'] as num?)?.toInt() ??
          (json['pointsCost'] as num?)?.toInt() ??
          0,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      imageUrl: _resolveImageUrl(rawImageUrl),
      category: json['category']?.toString() ?? 'Semua',
    );
  }

  static String _resolveImageUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return '';
    }

    final base = AppConstants.apiBaseUrl.replaceFirst(RegExp(r'/api/?$'), '');
    final baseUri = Uri.parse(base);
    final lower = trimmed.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      final uri = Uri.tryParse(trimmed);
      if (uri == null) {
        return trimmed;
      }

      final host = uri.host.toLowerCase();
      const localHosts = {'localhost', '127.0.0.1', '0.0.0.0', '::1'};

      // Rewrite localhost links from admin upload responses to mobile-reachable host.
      if (localHosts.contains(host)) {
        return baseUri
            .replace(path: uri.path, query: uri.hasQuery ? uri.query : null)
            .toString();
      }

      return uri.toString();
    }

    if (trimmed.startsWith('/')) {
      return '$base$trimmed';
    }

    return '$base/$trimmed';
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'points_cost': pointsCost,
      'stock': stock,
      'image_url': imageUrl,
      'category': category,
    };
  }

  RewardModel copyWith({
    int? id,
    String? name,
    String? description,
    int? pointsCost,
    int? stock,
    String? imageUrl,
    String? category,
  }) {
    return RewardModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      pointsCost: pointsCost ?? this.pointsCost,
      stock: stock ?? this.stock,
      imageUrl: imageUrl ?? this.imageUrl,
      category: category ?? this.category,
    );
  }
}
