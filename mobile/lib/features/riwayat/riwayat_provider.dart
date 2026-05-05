import 'package:flutter/foundation.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/models/deposit_model.dart';

class RiwayatProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;
  List<DepositModel> _deposits = [];
  double _totalWeight = 0;
  int _totalPoints = 0;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<DepositModel> get deposits => _deposits;
  double get totalWeight => _totalWeight;
  int get totalPoints => _totalPoints;

  /// Fetches member deposit history and summary from API.
  Future<void> fetchRiwayat() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final depositResponse = await ApiClient.instance.get(
        '/deposits/my',
        queryParameters: {'page': 1, 'per_page': 100},
      );
      final depositData =
          _extractMap(depositResponse['data']) ?? depositResponse;
      final list =
          _extractList(depositData['deposits']) ??
          _extractList(depositResponse['deposits']) ??
          [];

      _deposits = list
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .map(DepositModel.fromJson)
          .toList();

      _totalWeight = 0;
      _totalPoints = _deposits.fold<int>(0, (sum, d) => sum + d.pointsEarned);

      try {
        final summaryResponse = await ApiClient.instance.get(
          '/gamification/summary',
        );
        final summaryData =
            _extractMap(summaryResponse['data']) ?? summaryResponse;
        _totalWeight =
            (summaryData['total_weight_kg'] as num?)?.toDouble() ??
            _deposits.fold<double>(0, (sum, d) => sum + d.weightKg);
        _totalPoints =
            (summaryData['total_points'] as num?)?.toInt() ?? _totalPoints;
      } catch (_) {
        // Keep history usable even when summary endpoint is temporarily unavailable.
        _totalWeight = _deposits.fold<double>(0, (sum, d) => sum + d.weightKg);
      }
    } on TimeoutException catch (e) {
      _errorMessage = e.message;
    } on UnauthorizedException catch (e) {
      _errorMessage = e.message;
    } on NetworkException catch (e) {
      _errorMessage = e.message;
    } on ApiException catch (e) {
      _errorMessage = e.message;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  List<DepositModel> byWasteType(String type) {
    if (type == 'Semua') {
      return _deposits;
    }
    return _deposits
        .where((item) => item.wasteType.toLowerCase() == type.toLowerCase())
        .toList();
  }

  Map<String, dynamic>? _extractMap(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      return raw;
    }
    return null;
  }

  List<dynamic>? _extractList(dynamic raw) {
    if (raw is List) {
      return raw;
    }
    return null;
  }
}
