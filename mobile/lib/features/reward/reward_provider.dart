import 'package:flutter/foundation.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/models/reward_model.dart';

class RewardRedeemResult {
  final String message;
  final String redemptionCode;
  final String validationStatus;
  final String pickupLocation;
  final String pickupNote;

  const RewardRedeemResult({
    required this.message,
    required this.redemptionCode,
    required this.validationStatus,
    required this.pickupLocation,
    required this.pickupNote,
  });
}

class RewardProvider extends ChangeNotifier {
  static const String allCategory = 'Semua';

  List<RewardModel> _rewards = [];
  List<String> _categories = [allCategory];
  bool _isLoading = false;
  bool _isRedeeming = false;
  String _selectedCategory = allCategory;
  String? _errorMessage;

  List<RewardModel> get rewards {
    if (_selectedCategory == allCategory) {
      return _rewards;
    }
    return _rewards
        .where(
          (reward) =>
              reward.category.toLowerCase() == _selectedCategory.toLowerCase(),
        )
        .toList();
  }

  List<String> get categories => _categories;
  String get selectedCategory => _selectedCategory;
  bool get isLoading => _isLoading;
  bool get isRedeeming => _isRedeeming;
  String? get errorMessage => _errorMessage;

  /// Changes active category filter.
  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  /// Loads reward catalog from API.
  Future<void> fetchRewards() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.instance.get('/rewards');
      final data = _extractMap(response['data']) ?? response;
      final list =
          (data['items'] as List?) ??
          (data['rewards'] as List?) ??
          (response['data'] as List?) ??
          [];
      _rewards = list
          .whereType<Map<String, dynamic>>()
          .map(RewardModel.fromJson)
          .toList();

      final dynamicCategories =
          _rewards
              .map((reward) => reward.category.trim())
              .where(
                (category) =>
                    category.isNotEmpty &&
                    category.toLowerCase() != allCategory.toLowerCase(),
              )
              .toSet()
              .toList()
            ..sort();
      _categories = [allCategory, ...dynamicCategories];
      if (!_categories.contains(_selectedCategory)) {
        _selectedCategory = allCategory;
      }
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

  /// Redeems a reward by id.
  Future<RewardRedeemResult> redeemReward(int rewardId) async {
    _isRedeeming = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.instance.post(
        '/rewards/redeem',
        data: {'rewardId': rewardId, 'reward_id': rewardId},
      );

      final redemption = _extractMap(response['redemption']) ?? {};
      final redemptionCode = redemption['redemption_code']?.toString() ?? '-';

      return RewardRedeemResult(
        message:
            response['message']?.toString() ??
            'Penukaran berhasil diajukan dan menunggu validasi admin.',
        redemptionCode: redemptionCode,
        validationStatus:
            response['validation_status']?.toString() ??
            'pending_admin_approval',
        pickupLocation:
            response['pickup_location']?.toString() ??
            'Bank Sampah Dinas Lingkungan Hidup Kota Padang',
        pickupNote:
            response['pickup_note']?.toString() ??
            'Silakan klaim reward setelah status disetujui admin.',
      );
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
      _isRedeeming = false;
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
