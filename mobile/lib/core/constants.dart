/// Application-wide constants for the Sirkula mobile app.
class AppConstants {
  AppConstants._();

  static const String appName = 'Sirkula';
  static const String appTagline = 'CIRCULAR ECOSYSTEM';
  static const String appVersion = '1.0.0';

  // Production VPS Server URL:
  static const String apiBaseUrl = 'https://sirkula.tech/api';
  // Development URLs:
  // static const String apiBaseUrl = 'http://localhost:5000/api';
  // static const String apiBaseUrl = 'http://10.0.2.2:5000/api';
  // static const String apiBaseUrl = 'http://192.168.1.25:5000/api';

  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 10);

  static const String keyToken = 'token';
  static const String keyUserId = 'user_id';
  static const String keyUserName = 'user_name';
  static const String keyUserEmail = 'user_email';
  static const String keyUserPhone = 'user_phone';

  static const int defaultPage = 1;
  static const int defaultPageSize = 20;

  static const String routeLogin = '/login';
  static const String routeRegister = '/register';
  static const String routeSplash = '/splash';
  static const String routeNotifications = '/notifications';
  static const String routeRiwayatSetoran = '/riwayat-setoran';
  static const String routeMisi = '/misi';
  static const String routeLeaderboard = '/leaderboard';
  static const String routeRewardDetail = '/reward-detail';
  static const String routeSupportCenter = '/support-center';
  static const String routeUserGuide = '/user-guide';
  static const String routeEditProfile = '/edit-profile';
  static const String routeHome = '/home';
  static const String routeSetor = '/home/setor';
  static const String routeReward = '/home/reward';
  static const String routeProfil = '/home/profil';

  static const String tabBeranda = 'Beranda';
  static const String tabSetor = 'Setor';
  static const String tabReward = 'Reward';
  static const String tabProfil = 'Profil';

  static const List<String> wasteTypes = [
    'Plastik',
    'Kertas',
    'Logam',
    'Kaca',
    'Organik',
    'Elektronik',
  ];

  static const List<String> rewardCategories = [
    'Semua',
    'Populer',
    'Eco Living',
    'Voucher',
    'Digital',
  ];

  static const String labelEmailAddress = 'EMAIL ADDRESS';
  static const String labelPassword = 'PASSWORD';
  static const String labelForgot = 'FORGOT?';
  static const String labelLoginTitle = 'Welcome Back';
  static const String labelLoginSubtitle =
      'Access your personal impact sanctuary';
  static const String labelMasuk = 'MASUK';
  static const String labelSetorNow = 'Setor Sekarang';
  static const String labelKirimSetoran = 'Kirim Setoran';
  static const String labelMisiAktif = 'Misi Aktif';
  static const String labelRiwayatSetoran = 'Riwayat Setoran';
}
