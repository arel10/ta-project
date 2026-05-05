import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/core/helpers/token_helper.dart';

/// Singleton Dio HTTP client with JWT interceptor and error handling.
class ApiClient {
  static ApiClient? _instance;
  late final Dio dio;

  /// Callback to trigger logout/redirect on 401.
  static VoidCallback? onUnauthorized;

  ApiClient._() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: AppConstants.connectTimeout,
        receiveTimeout: AppConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // JWT Authorization interceptor
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await TokenHelper.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await TokenHelper.clearToken();
            onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );

    // Logging interceptor (debug only)
    if (kDebugMode) {
      dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          logPrint: (obj) => debugPrint(obj.toString()),
        ),
      );
    }
  }

  /// Get the singleton instance.
  static ApiClient get instance {
    _instance ??= ApiClient._();
    return _instance!;
  }

  /// Performs a GET request and returns parsed response data.
  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await dio.get(path, queryParameters: queryParameters);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Performs a POST request and returns parsed response data.
  Future<Map<String, dynamic>> post(String path, {dynamic data}) async {
    try {
      final response = await dio.post(path, data: data);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Performs a PUT request and returns parsed response data.
  Future<Map<String, dynamic>> put(String path, {dynamic data}) async {
    try {
      final response = await dio.put(path, data: data);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Converts DioException into domain-specific exceptions.
  Exception _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const TimeoutException();
      case DioExceptionType.connectionError:
        return const NetworkException();
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode ?? 0;
        final data = error.response?.data;
        String message = 'Terjadi kesalahan';
        if (data is Map<String, dynamic> && data.containsKey('message')) {
          message = data['message'];
        }
        if (statusCode == 401) {
          return UnauthorizedException(message);
        }
        return ApiException(message, statusCode: statusCode);
      default:
        return const NetworkException('Terjadi kesalahan jaringan');
    }
  }
}
