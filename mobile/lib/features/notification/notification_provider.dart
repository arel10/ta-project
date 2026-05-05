import 'package:flutter/foundation.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/exceptions.dart';

class NotificationItem {
  final String type;
  final String title;
  final String message;
  final DateTime createdAt;

  const NotificationItem({
    required this.type,
    required this.title,
    required this.message,
    required this.createdAt,
  });

  String get relativeTime {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} menit lalu';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours} jam lalu';
    }
    if (diff.inDays == 1) {
      return 'Kemarin';
    }
    return '${diff.inDays} hari lalu';
  }
}

class NotificationProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;
  List<NotificationItem> _all = [];

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<NotificationItem> get all => _all;

  List<NotificationItem> byType(String type) {
    if (type == 'Semua') {
      return _all;
    }
    return _all.where((item) => item.type == type).toList();
  }

  /// Fetches API-backed events and maps them into in-app notifications.
  Future<void> fetchNotifications() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final depositResponse = await ApiClient.instance.get(
        '/deposits/my',
        queryParameters: {'page': 1, 'per_page': 20},
      );
      final depositData =
          _extractMap(depositResponse['data']) ?? depositResponse;
      final deposits = (depositData['deposits'] as List?) ?? [];

      final rewardResponse = await ApiClient.instance.get(
        '/rewards/redemptions/my',
        queryParameters: {'page': 1, 'per_page': 20},
      );
      final rewardData = _extractMap(rewardResponse['data']) ?? rewardResponse;
      final redemptions = (rewardData['redemptions'] as List?) ?? [];

      final missionsResponse = await ApiClient.instance.get(
        '/gamification/missions',
      );
      final missionsData =
          _extractMap(missionsResponse['data']) ?? missionsResponse;
      final missions = (missionsData['missions'] as List?) ?? [];

      final items = <NotificationItem>[];

      for (final raw in deposits.whereType<Map<String, dynamic>>()) {
        final status = (raw['status']?.toString() ?? '').toLowerCase();
        final wasteType = raw['waste_type']?.toString() ?? 'setoran';
        final weight = (raw['weight_kg'] as num?)?.toDouble() ?? 0;
        final points = (raw['points_earned'] as num?)?.toInt() ?? 0;

        if (status == 'validated') {
          items.add(
            NotificationItem(
              type: 'Setoran',
              title: 'Setoran Tervalidasi!',
              message:
                  'Setoran $wasteType ${weight.toStringAsFixed(1)}kg disetujui. +$points poin ditambahkan.',
              createdAt: _parseDate(raw['validated_at'] ?? raw['created_at']),
            ),
          );
        } else if (status == 'pending') {
          items.add(
            NotificationItem(
              type: 'Setoran',
              title: 'Menunggu Penjemputan',
              message:
                  'Setoran $wasteType Anda sedang menunggu validasi admin.',
              createdAt: _parseDate(raw['created_at']),
            ),
          );
        }
      }

      for (final raw in redemptions.whereType<Map<String, dynamic>>()) {
        final reward = _extractMap(raw['reward']) ?? {};
        final rewardName = reward['name']?.toString() ?? 'Reward';
        final status = raw['status']?.toString() ?? 'pending';
        final pointsSpent = (raw['points_spent'] as num?)?.toInt() ?? 0;

        items.add(
          NotificationItem(
            type: 'Promo',
            title: 'Update Penukaran Reward',
            message:
                'Penukaran $rewardName ($pointsSpent poin) berstatus ${status.toUpperCase()}.',
            createdAt: _parseDate(raw['created_at']),
          ),
        );
      }

      for (final raw in missions.whereType<Map<String, dynamic>>()) {
        final isCompleted = raw['is_completed'] as bool? ?? false;
        if (!isCompleted) {
          continue;
        }
        items.add(
          NotificationItem(
            type: 'Promo',
            title: 'Misi Selesai!',
            message: 'Selamat, misi ${raw['title']} berhasil diselesaikan.',
            createdAt: _parseDate(raw['created_at']),
          ),
        );
      }

      items.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      _all = items;
    } on TimeoutException catch (e) {
      _errorMessage = e.message;
      rethrow;
    } on UnauthorizedException catch (e) {
      _errorMessage = e.message;
      rethrow;
    } on NetworkException catch (e) {
      _errorMessage = e.message;
      rethrow;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Map<String, dynamic>? _extractMap(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      return raw;
    }
    return null;
  }

  DateTime _parseDate(dynamic raw) {
    final parsed = DateTime.tryParse(raw?.toString() ?? '');
    return parsed ?? DateTime.now();
  }
}
