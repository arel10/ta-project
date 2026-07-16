import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sirkula/core/constants.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _goNext();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _goNext() async {
    await Future<void>.delayed(const Duration(seconds: 4));
    if (!mounted) {
      return;
    }
    context.go(AppConstants.routeHome);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFD8EDCF), Color(0xFFE8F2E3), Color(0xFFF2F8EE)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const Spacer(flex: 3),
              Center(
                child: AnimatedBuilder(
                  animation: _controller,
                  builder: (_, child) {
                    return Transform.rotate(
                      angle: _controller.value * 2 * 3.141592653589793,
                      child: child,
                    );
                  },
                  child: Image.asset(
                    'assets/images/Sirkula.png',
                    width: 140,
                    height: 140,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Sirkula',
                style: GoogleFonts.poppins(
                  fontSize: 42,
                  color: const Color(0xFF0F6A24),
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'E K O S I S T E M   D A U R   U L A N G',
                style: GoogleFonts.poppins(
                  letterSpacing: 3,
                  fontSize: 12,
                  color: const Color(0xFF7A8C78),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(flex: 4),
              SizedBox(
                width: 120,
                child: TweenAnimationBuilder(
                  tween: Tween<double>(begin: 0, end: 1),
                  duration: const Duration(seconds: 4),
                  builder: (context, double value, _) {
                    return LinearProgressIndicator(
                      minHeight: 6,
                      borderRadius:
                          const BorderRadius.all(Radius.circular(30)),
                      value: value,
                      backgroundColor: const Color(0xFFD6DFD0),
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Color(0xFF0E7427),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Untuk Bumi yang Lebih Bersih',
                style: GoogleFonts.poppins(
                  color: const Color(0xFF9AA898),
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.eco_outlined, color: Color(0xFFAAB8A8), size: 18),
                  SizedBox(width: 10),
                  Icon(Icons.recycling, color: Color(0xFFAAB8A8), size: 18),
                  SizedBox(width: 10),
                  Icon(Icons.spa_outlined, color: Color(0xFFAAB8A8), size: 18),
                ],
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
