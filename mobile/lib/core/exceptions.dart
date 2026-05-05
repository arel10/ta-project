/// Represents API-level failures with optional HTTP status code.
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException(this.message, {this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Represents connectivity issues (no internet, DNS, etc.).
class NetworkException implements Exception {
  final String message;

  const NetworkException([this.message = 'Tidak ada koneksi internet']);

  @override
  String toString() => 'NetworkException: $message';
}

/// Represents authentication/authorization failures.
class UnauthorizedException implements Exception {
  final String message;

  const UnauthorizedException([
    this.message = 'Sesi telah berakhir, silakan login kembali',
  ]);

  @override
  String toString() => 'UnauthorizedException: $message';
}

/// Represents request timeout failures.
class TimeoutException implements Exception {
  final String message;

  const TimeoutException([this.message = 'Koneksi timeout, coba lagi']);

  @override
  String toString() => 'TimeoutException: $message';
}
