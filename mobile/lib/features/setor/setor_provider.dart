import 'package:flutter/foundation.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/models/deposit_model.dart';
import 'package:sirkula/models/waste_point_rate_model.dart';

class SetorProvider extends ChangeNotifier {
  bool _isSubmitting = false;
  bool _isLoadingRates = false;
  List<DepositModel> _depositHistory = [];
  List<WastePointRateModel> _wasteRates = [];
  String? _errorMessage;

  bool get isSubmitting => _isSubmitting;
  bool get isLoadingRates => _isLoadingRates;
  List<DepositModel> get depositHistory => _depositHistory;
  List<WastePointRateModel> get wasteRates => _wasteRates;
  String? get errorMessage => _errorMessage;

  String getWasteLabel(String wasteCode) {
    final key = wasteCode.trim().toLowerCase();
    final found = _wasteRates.where((r) => r.code.toLowerCase() == key);
    if (found.isNotEmpty) {
      return found.first.displayLabel;
    }
    return wasteCode;
  }

  int getRatePerKg(String wasteCode) {
    final key = wasteCode.trim().toLowerCase();
    final found = _wasteRates.where((r) => r.code.toLowerCase() == key);
    if (found.isNotEmpty) {
      return found.first.pointsPerKg;
    }
    return 0;
  }

  Future<void> fetchWastePointRates() async {
    _isLoadingRates = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.instance.get(
        '/deposits/waste-point-rates',
      );
      final data = _extractMap(response['data']) ?? response;
      final list = (data['rates'] as List?) ?? [];

      _wasteRates = list
          .whereType<Map<String, dynamic>>()
          .map(WastePointRateModel.fromJson)
          .where((rate) => rate.isActive)
          .toList();
    } on TimeoutException catch (e) {
      _errorMessage = e.message;
    } on UnauthorizedException catch (e) {
      _errorMessage = e.message;
    } on NetworkException catch (e) {
      _errorMessage = e.message;
    } on ApiException catch (e) {
      _errorMessage = e.message;
    } finally {
      _isLoadingRates = false;
      notifyListeners();
    }
  }

  /// Submits a new waste deposit and returns earned points if provided by backend.
  Future<int> submitDeposit({
    required String wasteCode,
    required double weightKg,
    String? notes,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final payload = {
        'waste_type': wasteCode.toLowerCase(),
        'weight_kg': weightKg,
      };

      if ((notes ?? '').trim().isNotEmpty) {
        payload['notes'] = notes!.trim();
      }

      final response = await ApiClient.instance.post(
        '/deposits',
        data: payload,
      );
      final data = _extractMap(response['data']) ?? response;
      final points =
          (data['points_earned'] as num?)?.toInt() ??
          (data['pointsEarned'] as num?)?.toInt() ??
          0;
      await fetchDepositHistory();
      return points;
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
      _isSubmitting = false;
      notifyListeners();
    }
  }

  /// Fetches user deposit history from API.
  Future<void> fetchDepositHistory() async {
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.instance.get(
        '/deposits/my',
        queryParameters: {'page': 1, 'per_page': 20},
      );

      final data = _extractMap(response['data']) ?? response;
      final list = (data['deposits'] as List?) ?? [];
      _depositHistory = list
          .whereType<Map<String, dynamic>>()
          .map(DepositModel.fromJson)
          .toList();
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
      notifyListeners();
    }
  }

  Map<String, dynamic>? _extractMap(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      return raw;
    }
    return null;
  }
}
