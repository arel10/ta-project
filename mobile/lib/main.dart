import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/api_client.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/auth/auth_provider.dart';
import 'package:sirkula/features/auth/login_screen.dart';
import 'package:sirkula/features/auth/register_screen.dart';
import 'package:sirkula/features/home/home_provider.dart';
import 'package:sirkula/features/home/home_screen.dart';
import 'package:sirkula/features/misi/misi_screen.dart';
import 'package:sirkula/features/notification/notification_provider.dart';
import 'package:sirkula/features/notification/notification_screen.dart';
import 'package:sirkula/features/profil/edit_profile_screen.dart';
import 'package:sirkula/features/profil/profil_provider.dart';
import 'package:sirkula/features/reward/reward_provider.dart';
import 'package:sirkula/features/reward/leaderboard_provider.dart';
import 'package:sirkula/features/reward/reward_detail_screen.dart';
import 'package:sirkula/features/reward/reward_leaderboard_screen.dart';
import 'package:sirkula/features/riwayat/riwayat_provider.dart';
import 'package:sirkula/features/riwayat/riwayat_setoran_screen.dart';
import 'package:sirkula/features/setor/setor_provider.dart';
import 'package:sirkula/features/splash/splash_screen.dart';
import 'package:sirkula/features/support/support_center_screen.dart';
import 'package:sirkula/features/support/user_guide_screen.dart';
import 'package:sirkula/models/reward_model.dart';
import 'package:sirkula/models/user_model.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');
  runApp(const SirkulaApp());
}

class SirkulaApp extends StatefulWidget {
  const SirkulaApp({super.key});

  @override
  State<SirkulaApp> createState() => _SirkulaAppState();
}

class _SirkulaAppState extends State<SirkulaApp> {
  late final AuthProvider _authProvider;
  late final GoRouter _router;

  Page<dynamic> _buildPage(
    GoRouterState state,
    Widget child, {
    bool withoutTransition = false,
  }) {
    if (withoutTransition) {
      return NoTransitionPage<dynamic>(key: state.pageKey, child: child);
    }

    return CustomTransitionPage<dynamic>(
      key: state.pageKey,
      child: child,
      transitionDuration: const Duration(milliseconds: 360),
      reverseTransitionDuration: const Duration(milliseconds: 280),
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final fadeAnimation = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
          reverseCurve: Curves.easeInCubic,
        );

        final slideAnimation =
            Tween<Offset>(
              begin: const Offset(0.04, 0.0),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(
                parent: animation,
                curve: Curves.easeOutQuart,
                reverseCurve: Curves.easeInQuart,
              ),
            );

        return FadeTransition(
          opacity: fadeAnimation,
          child: SlideTransition(position: slideAnimation, child: child),
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();
    _authProvider.checkAuth();

    ApiClient.onUnauthorized = () {
      _authProvider.forceLogout();
    };

    _router = GoRouter(
      initialLocation: AppConstants.routeSplash,
      refreshListenable: _authProvider,
      redirect: (context, state) {
        final bool inAuthRoutes =
            state.matchedLocation == AppConstants.routeLogin ||
            state.matchedLocation == AppConstants.routeRegister ||
            state.matchedLocation == AppConstants.routeSplash;
        if (_authProvider.isLoading) {
          return null;
        }

        if (!_authProvider.isLoggedIn && !inAuthRoutes) {
          return AppConstants.routeLogin;
        }

        if (_authProvider.isLoggedIn && inAuthRoutes) {
          return AppConstants.routeHome;
        }

        return null;
      },
      routes: [
        GoRoute(
          path: AppConstants.routeSplash,
          pageBuilder: (context, state) =>
              _buildPage(state, const SplashScreen(), withoutTransition: true),
        ),
        GoRoute(
          path: AppConstants.routeLogin,
          pageBuilder: (context, state) =>
              _buildPage(state, const LoginScreen()),
        ),
        GoRoute(
          path: AppConstants.routeRegister,
          pageBuilder: (context, state) =>
              _buildPage(state, const RegisterScreen()),
        ),
        GoRoute(
          path: AppConstants.routeHome,
          pageBuilder: (context, state) => _buildPage(
            state,
            const HomeScreen(initialTabIndex: 0),
            withoutTransition: true,
          ),
          routes: [
            GoRoute(
              path: 'setor',
              pageBuilder: (context, state) => _buildPage(
                state,
                const HomeScreen(initialTabIndex: 1),
                withoutTransition: true,
              ),
            ),
            GoRoute(
              path: 'reward',
              pageBuilder: (context, state) => _buildPage(
                state,
                const HomeScreen(initialTabIndex: 2),
                withoutTransition: true,
              ),
            ),
            GoRoute(
              path: 'profil',
              pageBuilder: (context, state) => _buildPage(
                state,
                const HomeScreen(initialTabIndex: 3),
                withoutTransition: true,
              ),
            ),
          ],
        ),
        GoRoute(
          path: AppConstants.routeNotifications,
          pageBuilder: (context, state) =>
              _buildPage(state, const NotificationScreen()),
        ),
        GoRoute(
          path: AppConstants.routeRiwayatSetoran,
          pageBuilder: (context, state) =>
              _buildPage(state, const RiwayatSetoranScreen()),
        ),
        GoRoute(
          path: AppConstants.routeMisi,
          pageBuilder: (context, state) =>
              _buildPage(state, const MisiScreen()),
        ),
        GoRoute(
          path: AppConstants.routeLeaderboard,
          pageBuilder: (context, state) =>
              _buildPage(state, const RewardLeaderboardScreen()),
        ),
        GoRoute(
          path: AppConstants.routeSupportCenter,
          pageBuilder: (context, state) =>
              _buildPage(state, const SupportCenterScreen()),
        ),
        GoRoute(
          path: AppConstants.routeUserGuide,
          pageBuilder: (context, state) =>
              _buildPage(state, const UserGuideScreen()),
        ),
        GoRoute(
          path: AppConstants.routeEditProfile,
          pageBuilder: (context, state) {
            final user = state.extra is UserModel
                ? state.extra as UserModel
                : null;
            return _buildPage(state, EditProfileScreen(initialUser: user));
          },
        ),
        GoRoute(
          path: AppConstants.routeRewardDetail,
          pageBuilder: (context, state) {
            final reward = state.extra;
            if (reward is RewardModel) {
              return _buildPage(state, RewardDetailScreen(reward: reward));
            }
            return _buildPage(
              state,
              const Scaffold(
                body: Center(child: Text('Data reward tidak ditemukan')),
              ),
            );
          },
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF1A7A2C),
      brightness: Brightness.light,
      surface: const Color(0xFFF1F6EA),
    );

    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: _authProvider),
        ChangeNotifierProvider<HomeProvider>(create: (_) => HomeProvider()),
        ChangeNotifierProvider<SetorProvider>(create: (_) => SetorProvider()),
        ChangeNotifierProvider<RewardProvider>(create: (_) => RewardProvider()),
        ChangeNotifierProvider<LeaderboardProvider>(
          create: (_) => LeaderboardProvider(),
        ),
        ChangeNotifierProvider<RiwayatProvider>(
          create: (_) => RiwayatProvider(),
        ),
        ChangeNotifierProvider<NotificationProvider>(
          create: (_) => NotificationProvider(),
        ),
        ChangeNotifierProvider<ProfilProvider>(create: (_) => ProfilProvider()),
      ],
      child: MaterialApp.router(
        debugShowCheckedModeBanner: false,
        title: AppConstants.appName,
        routerConfig: _router,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: colorScheme,
          scaffoldBackgroundColor: const Color(0xFFF2F7ED),
          textTheme: GoogleFonts.poppinsTextTheme(),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFFF0F5EC),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFD4DFC8)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(
                color: Color(0xFF1A7A2C),
                width: 1.4,
              ),
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFD4DFC8)),
            ),
          ),
        ),
      ),
    );
  }
}
