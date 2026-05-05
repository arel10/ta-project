import 'package:flutter_test/flutter_test.dart';
import 'package:sirkula/core/constants.dart';

void main() {
  test('app constants smoke test', () {
    expect(AppConstants.appName, 'Sirkula');
    expect(AppConstants.apiBaseUrl, 'http://10.0.2.2:5000/api');
  });
}
