import 'package:flutter/foundation.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/models/deposit_model.dart';
import 'package:sirkula/models/mission_model.dart';

class HomeProvider extends ChangeNotifier {
  int _totalPoints = 0;
  String _level = '-';
  double _levelProgress = 0;
  int _pointsToNextLevel = 0;
  String _nextLevel = '-';
  List<MissionModel> _activeMissions = [];
  List<DepositModel> _recentDeposits = [];
  bool _isLoading = false;
  String? _errorMessage;

  int get totalPoints => _totalPoints;
  String get level => _level;
  double get levelProgress => _levelProgress;
  int get pointsToNextLevel => _pointsToNextLevel;
  String get nextLevel => _nextLevel;
  List<MissionModel> get activeMissions => _activeMissions;
  List<DepositModel> get recentDeposits => _recentDeposits;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Loads the member dashboard summary from API.
  Future<void> fetchDashboardSummary() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final summaryResponse = await ApiClient.instance.get(
        '/gamification/summary',
      );
      final summaryData =
          _extractMap(summaryResponse['data']) ?? summaryResponse;
      _totalPoints =
          (summaryData['total_points'] as num?)?.toInt() ??
          (summaryData['points'] as num?)?.toInt() ??
          0;
      _level = summaryData['level']?.toString() ?? '-';

      final levelInfo = _extractMap(summaryData['level_progress']) ?? {};
      _levelProgress =
          ((levelInfo['progress_percent'] as num?)?.toDouble() ?? 0) / 100;
      final nextThreshold = (levelInfo['next_threshold'] as num?)?.toInt();
      _pointsToNextLevel = nextThreshold == null
          ? 0
          : (nextThreshold - _totalPoints).clamp(0, 1 << 31);
      _nextLevel = levelInfo['next_level']?.toString() ?? '-';

      final missionsResponse = await ApiClient.instance.get(
        '/gamification/missions',
      );
      final missionsData =
          _extractMap(missionsResponse['data']) ?? missionsResponse;
      final missionsRaw = (missionsData['missions'] as List?) ?? [];
      _activeMissions = missionsRaw
          .whereType<Map<String, dynamic>>()
          .map(MissionModel.fromJson)
          .toList();

      final depositResponse = await ApiClient.instance.get(
        '/deposits/my',
        queryParameters: {'page': 1, 'per_page': 5},
      );
      final depositData =
          _extractMap(depositResponse['data']) ?? depositResponse;
      final depositsRaw = (depositData['deposits'] as List?) ?? [];
      _recentDeposits = depositsRaw
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
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Refreshes dashboard summary for pull-to-refresh behavior.
  Future<void> refresh() async {
    await fetchDashboardSummary();
  }

  Map<String, dynamic>? _extractMap(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      return raw;
    }
    return null;
  }
}
