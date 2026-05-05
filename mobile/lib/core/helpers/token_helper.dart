import 'package:shared_preferences/shared_preferences.dart';
import 'package:sirkula/core/constants.dart';

/// Helper for managing JWT tokens in SharedPreferences.
class TokenHelper {
  TokenHelper._();

  /// Saves the authentication token.
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.keyToken, token);
  }

  /// Returns token if available, otherwise null.
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.keyToken);
  }

  /// Returns true when token exists.
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Clears only auth token.
  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyToken);
  }
}
