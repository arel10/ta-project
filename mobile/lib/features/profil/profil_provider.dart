import 'package:flutter/foundation.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/models/user_model.dart';

class ProfilProvider extends ChangeNotifier {
  UserModel? _userModel;
  int _totalPoints = 0;
  String _level = '-';
  int _totalDeposits = 0;
  int _badgesEarned = 0;
  int _totalBadges = 0;
  List<Map<String, dynamic>> _earnedBadges = [];
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  UserModel? get userModel => _userModel;
  int get totalPoints => _totalPoints;
  String get level => _level;
  int get totalDeposits => _totalDeposits;
  int get badgesEarned => _badgesEarned;
  int get totalBadges => _totalBadges;
  List<Map<String, dynamic>> get earnedBadges => _earnedBadges;
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  /// Fetches member profile details from API.
  Future<void> fetchProfile() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.instance.get('/auth/me');
      final data = _extractMap(response['data']) ?? response;
      final userData =
          _extractMap(data['user']) ?? _extractMap(response['user']) ?? data;
      _userModel = UserModel.fromJson(userData);
      _totalPoints = _userModel?.points ?? 0;
      _level = _userModel?.level ?? '-';
      _totalDeposits = 0;
      _badgesEarned = 0;
      _totalBadges = 0;
      _earnedBadges = [];

      try {
        final summaryResponse = await ApiClient.instance.get(
          '/gamification/summary',
        );
        final summaryData =
            _extractMap(summaryResponse['data']) ?? summaryResponse;
        _totalPoints =
            (summaryData['total_points'] as num?)?.toInt() ??
            _userModel?.points ??
            0;
        _level = summaryData['level']?.toString() ?? _userModel?.level ?? '-';
        _totalDeposits = (summaryData['total_deposits'] as num?)?.toInt() ?? 0;
        _badgesEarned = (summaryData['badges_earned'] as num?)?.toInt() ?? 0;
        _totalBadges = (summaryData['total_badges'] as num?)?.toInt() ?? 0;
      } catch (_) {
        // Keep rendering profile using /auth/me fallback values.
      }

      try {
        final badgeResponse = await ApiClient.instance.get(
          '/gamification/badges/my',
        );
        final badgeData = _extractMap(badgeResponse['data']) ?? badgeResponse;
        final rawBadges = (badgeData['earned_badges'] as List?) ?? [];
        _earnedBadges = rawBadges.whereType<Map<String, dynamic>>().toList();
      } catch (_) {
        _earnedBadges = [];
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

  /// Updates member profile and refreshes local user state.
  Future<void> updateProfile({
    required String name,
    required String email,
    required String accountNumber,
    required String gender,
    required String nik,
    required String address,
    required String department,
  }) async {
    _isSaving = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final payload = {
        'name': name.trim(),
        'email': email.trim(),
        'account_number': accountNumber.trim(),
        'gender': gender.trim(),
        'nik': nik.trim(),
        'address': address.trim(),
        'department': department.trim(),
      };

      final response = await ApiClient.instance.put('/auth/me', data: payload);
      final data = _extractMap(response['data']) ?? response;
      final userData =
          _extractMap(data['user']) ?? _extractMap(response['user']) ?? data;
      _userModel = UserModel.fromJson(userData);
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
      _isSaving = false;
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
