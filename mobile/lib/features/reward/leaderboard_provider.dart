import 'package:flutter/foundation.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/exceptions.dart';

class LeaderboardEntry {
  final int rank;
  final int userId;
  final String name;
  final int totalPoints;
  final String level;

  const LeaderboardEntry({
    required this.rank,
    required this.userId,
    required this.name,
    required this.totalPoints,
    required this.level,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      userId: (json['user_id'] as num?)?.toInt() ?? 0,
      name: json['name']?.toString() ?? '-',
      totalPoints: (json['total_points'] as num?)?.toInt() ?? 0,
      level: json['level']?.toString() ?? '-',
    );
  }
}

class LeaderboardProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;
  List<LeaderboardEntry> _entries = [];
  int? _currentUserRank;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<LeaderboardEntry> get entries => _entries;
  int? get currentUserRank => _currentUserRank;

  /// Fetches community leaderboard from API.
  Future<void> fetchLeaderboard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiClient.instance.get(
        '/gamification/leaderboard',
      );
      final data = _extractMap(response['data']) ?? response;
      final list = (data['leaderboard'] as List?) ?? [];
      _entries = list
          .whereType<Map<String, dynamic>>()
          .map(LeaderboardEntry.fromJson)
          .toList();
      _currentUserRank = (data['current_user_rank'] as num?)?.toInt();
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
}
