import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/core/helpers/token_helper.dart';
import 'package:sirkula/models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoggedIn = false;
  bool _isLoading = false;
  String? _errorMessage;
  UserModel? _currentUser;

  bool get isLoggedIn => _isLoggedIn;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  UserModel? get currentUser => _currentUser;

  /// Restores auth session from local storage.
  Future<void> checkAuth() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _isLoggedIn = await TokenHelper.isLoggedIn();
      if (_isLoggedIn) {
        final profile = await _tryFetchProfile();
        _currentUser = profile;
      }
    } catch (_) {
      _isLoggedIn = false;
      _currentUser = null;
      await TokenHelper.clearToken();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Authenticates the user and persists token locally.
  Future<void> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final payload = {'email': email.trim(), 'password': password};

      final response = await ApiClient.instance.post(
        '/auth/login',
        data: payload,
      );
      final data = _extractMap(response['data']) ?? response;
      final userData =
          _extractMap(data['user']) ?? _extractMap(response['user']);

      final token =
          data['token']?.toString() ??
          data['access_token']?.toString() ??
          response['token']?.toString() ??
          response['access_token']?.toString();

      if (token == null || token.isEmpty) {
        throw const ApiException('Token tidak ditemukan pada respons login');
      }

      if (userData != null && userData['role'] == 'admin') {
        throw const ApiException(
          'Akses ditolak. Akun administrator tidak dapat masuk ke aplikasi ini.',
        );
      }

      await TokenHelper.saveToken(token);
      await _saveUserPrefs(userData);

      _isLoggedIn = true;
      _currentUser = userData == null
          ? _currentUser
          : UserModel.fromJson(userData);
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
    } catch (_) {
      _errorMessage = 'Login gagal, silakan coba lagi';
      throw const ApiException('Login gagal, silakan coba lagi');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Registers a new member account with optional KTP image upload.
  Future<String> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    String? nik,
    String? gender,
    String? address,
    String? ktpPath,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      dynamic dataPayload;

      if (ktpPath != null && ktpPath.isNotEmpty) {
        dataPayload = FormData.fromMap({
          'name': name.trim(),
          'email': email.trim(),
          'phone': phone.trim(),
          'password': password,
          if (nik != null && nik.isNotEmpty) 'nik': nik.trim(),
          if (gender != null && gender.isNotEmpty) 'gender': gender.trim(),
          if (address != null && address.isNotEmpty) 'address': address.trim(),
          'ktp_image': await MultipartFile.fromFile(ktpPath),
        });
      } else {
        dataPayload = {
          'name': name.trim(),
          'email': email.trim(),
          'phone': phone.trim(),
          'password': password,
          if (nik != null && nik.isNotEmpty) 'nik': nik.trim(),
          if (gender != null && gender.isNotEmpty) 'gender': gender.trim(),
          if (address != null && address.isNotEmpty) 'address': address.trim(),
        };
      }

      final response = await ApiClient.instance.post(
        '/auth/register',
        data: dataPayload,
      );

      final message = response['message']?.toString() ??
          'Registrasi berhasil. Silakan tunggu verifikasi admin.';

      return message;
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
    } catch (_) {
      _errorMessage = 'Pendaftaran gagal, silakan coba lagi';
      throw const ApiException('Pendaftaran gagal, silakan coba lagi');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clears auth session and local token.
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await TokenHelper.clearToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.keyUserId);
    await prefs.remove(AppConstants.keyUserName);
    await prefs.remove(AppConstants.keyUserEmail);
    await prefs.remove(AppConstants.keyUserPhone);

    _isLoggedIn = false;
    _currentUser = null;
    _errorMessage = null;
    _isLoading = false;
    notifyListeners();
  }

  /// Clears auth session without triggering loading state for interceptor use.
  Future<void> forceLogout() async {
    await TokenHelper.clearToken();
    _isLoggedIn = false;
    _currentUser = null;
    _errorMessage = null;
    notifyListeners();
  }

  Future<UserModel?> _tryFetchProfile() async {
    try {
      final response = await ApiClient.instance.get('/auth/me');
      final data = _extractMap(response['data']) ?? response;
      final userData =
          _extractMap(data['user']) ?? _extractMap(response['user']) ?? data;
      return UserModel.fromJson(userData);
    } catch (_) {
      return null;
    }
  }

  Future<void> _saveUserPrefs(Map<String, dynamic>? userData) async {
    if (userData == null) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(
      AppConstants.keyUserId,
      (userData['id'] as num?)?.toInt() ?? 0,
    );
    await prefs.setString(
      AppConstants.keyUserName,
      userData['name']?.toString() ?? '',
    );
    await prefs.setString(
      AppConstants.keyUserEmail,
      userData['email']?.toString() ?? '',
    );
    await prefs.setString(
      AppConstants.keyUserPhone,
      userData['phone']?.toString() ?? '',
    );
  }

  Map<String, dynamic>? _extractMap(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      return raw;
    }
    return null;
  }
}
