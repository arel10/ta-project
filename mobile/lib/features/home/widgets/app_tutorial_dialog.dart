import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppTutorialDialog extends StatefulWidget {
  const AppTutorialDialog({super.key});

  static const String prefKey = 'has_seen_app_tutorial_v1';

  /// Show tutorial dialog if user hasn't seen it yet.
  static Future<void> showIfFirstTime(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    final hasSeen = prefs.getBool(prefKey) ?? false;
    if (!hasSeen && context.mounted) {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AppTutorialDialog(),
      );
    }
  }

  /// Force show tutorial dialog anytime (e.g. from Support Center).
  static Future<void> forceShow(BuildContext context) async {
    if (context.mounted) {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AppTutorialDialog(),
      );
    }
  }

  @override
  State<AppTutorialDialog> createState() => _AppTutorialDialogState();
}

class _AppTutorialDialogState extends State<AppTutorialDialog> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_TutorialStep> _steps = const [
    _TutorialStep(
      icon: Icons.eco_rounded,
      iconColor: Color(0xFF1A7A2C),
      bgColor: Color(0xFFE8F4E5),
      title: 'Selamat Datang di Sirkula!',
      description:
          'Platform digital Bank Sampah untuk mendukung ekosistem sirkular yang lebih hijau di Kota Padang.',
    ),
    _TutorialStep(
      icon: Icons.recycling_rounded,
      iconColor: Color(0xFF0284C7),
      bgColor: Color(0xFFE0F2FE),
      title: 'Setor Sampah & Dapatkan Poin',
      description:
          'Pilih jenis sampah (Plastik, Kertas, Logam, Kaca, Organik, Elektronik), input perkiraan berat, dan kumpulkan poin setiap kali menyetor!',
    ),
    _TutorialStep(
      icon: Icons.card_giftcard_rounded,
      iconColor: Color(0xFFD97706),
      bgColor: Color(0xFFFEF3C7),
      title: 'Tukarkan Poin dengan Reward',
      description:
          'Tukarkan akumulasi poinmu dengan voucher dan barang bermanfaat di Katalog Reward. Cek status klaimmu di tab Riwayat.',
    ),
    _TutorialStep(
      icon: Icons.emoji_events_rounded,
      iconColor: Color(0xFF7C3AED),
      bgColor: Color(0xFFEDE9FE),
      title: 'Selesaikan Misi & Naikkan Peringkat',
      description:
          'Ikuti misi harian & mingguan untuk mendapatkan poin ekstra, kumpulkan badge keren, dan raih posisi puncak di Leaderboard!',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _completeTutorial() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppTutorialDialog.prefKey, true);
    if (mounted) {
      Navigator.pop(context);
    }
  }

  void _nextPage() {
    if (_currentPage < _steps.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeInOut,
      );
    } else {
      _completeTutorial();
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      elevation: 8,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Page Indicator
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_steps.length, (index) {
                final isActive = index == _currentPage;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 240),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: isActive ? 22 : 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: isActive
                        ? const Color(0xFF1A7A2C)
                        : const Color(0xFFD4DFC8),
                    borderRadius: BorderRadius.circular(10),
                  ),
                );
              }),
            ),
            const SizedBox(height: 20),

            // Page View Slider
            SizedBox(
              height: 280,
              child: PageView.builder(
                controller: _pageController,
                itemCount: _steps.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemBuilder: (context, index) {
                  final step = _steps[index];
                  return Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          color: step.bgColor,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          step.icon,
                          size: 48,
                          color: step.iconColor,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        step.title,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1A241D),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        step.description,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          height: 1.5,
                          color: const Color(0xFF5F6E60),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 16),

            // Action Buttons
            Row(
              children: [
                if (_currentPage > 0) ...[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _prevPage,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        side: const BorderSide(color: Color(0xFF1A7A2C)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: Text(
                        'Kembali',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1A7A2C),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                ] else ...[
                  TextButton(
                    onPressed: _completeTutorial,
                    child: Text(
                      'Lewati',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: const Color(0xFF7A8C78),
                      ),
                    ),
                  ),
                  const Spacer(),
                ],
                Expanded(
                  flex: _currentPage > 0 ? 1 : 0,
                  child: SizedBox(
                    width: _currentPage == 0 ? 140 : null,
                    child: ElevatedButton(
                      onPressed: _nextPage,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        backgroundColor: const Color(0xFF1A7A2C),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        elevation: 2,
                      ),
                      child: Text(
                        _currentPage == _steps.length - 1
                            ? 'Selesai & Paham'
                            : 'Lanjut',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TutorialStep {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String title;
  final String description;

  const _TutorialStep({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.title,
    required this.description,
  });
}
