import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/auth/auth_provider.dart';
import 'package:sirkula/features/home/home_provider.dart';
import 'package:sirkula/features/setor/setor_screen.dart';
import 'package:sirkula/features/reward/reward_screen.dart';
import 'package:sirkula/features/profil/profil_screen.dart';
import 'package:sirkula/models/deposit_model.dart';
import 'package:sirkula/models/mission_model.dart';

class HomeScreen extends StatefulWidget {
  final int initialTabIndex;

  const HomeScreen({super.key, this.initialTabIndex = 0});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int get _selectedIndex => widget.initialTabIndex;

  /// Handles tab switch and updates route path.
  void _onTabTapped(int index) {
    if (_selectedIndex == index) {
      return;
    }

    if (index == 0) {
      context.go(AppConstants.routeHome);
    } else if (index == 1) {
      context.go(AppConstants.routeSetor);
    } else if (index == 2) {
      context.go(AppConstants.routeReward);
    } else {
      context.go(AppConstants.routeProfil);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tabs = <Widget>[
      const KeyedSubtree(
        key: PageStorageKey<String>('tab-beranda'),
        child: _BerandaTab(),
      ),
      const KeyedSubtree(
        key: PageStorageKey<String>('tab-setor'),
        child: SetorScreen(),
      ),
      const KeyedSubtree(
        key: PageStorageKey<String>('tab-reward'),
        child: RewardScreen(),
      ),
      const KeyedSubtree(
        key: PageStorageKey<String>('tab-profil'),
        child: ProfilScreen(),
      ),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF2F7ED),
      body: Stack(
        fit: StackFit.expand,
        children: List.generate(tabs.length, (index) {
          final isActive = _selectedIndex == index;
          return Positioned.fill(
            child: IgnorePointer(
              ignoring: !isActive,
              child: TickerMode(
                enabled: isActive,
                child: AnimatedSlide(
                  duration: const Duration(milliseconds: 320),
                  curve: Curves.easeOutCubic,
                  offset: isActive ? Offset.zero : const Offset(0.03, 0),
                  child: AnimatedOpacity(
                    duration: const Duration(milliseconds: 260),
                    curve: Curves.easeOutCubic,
                    opacity: isActive ? 1 : 0,
                    child: tabs[index],
                  ),
                ),
              ),
            ),
          );
        }),
      ),
      floatingActionButton: _selectedIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () {
                context.go(AppConstants.routeSetor);
              },
              backgroundColor: const Color(0xFF1A7A2C),
              foregroundColor: Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
              label: Row(
                children: [
                  Text(
                    'Setor Sekarang',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.add, size: 20),
                ],
              ),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFF0F4EA),
          borderRadius: BorderRadius.circular(22),
          boxShadow: const [
            BoxShadow(
              color: Color(0x18000000),
              blurRadius: 14,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _NavItem(
              icon: Icons.home_filled,
              label: AppConstants.tabBeranda,
              selected: _selectedIndex == 0,
              onTap: () => _onTabTapped(0),
            ),
            _NavItem(
              icon: Icons.recycling,
              label: AppConstants.tabSetor,
              selected: _selectedIndex == 1,
              onTap: () => _onTabTapped(1),
            ),
            _NavItem(
              icon: Icons.card_giftcard,
              label: AppConstants.tabReward,
              selected: _selectedIndex == 2,
              onTap: () => _onTabTapped(2),
            ),
            _NavItem(
              icon: Icons.person_outline,
              label: AppConstants.tabProfil,
              selected: _selectedIndex == 3,
              onTap: () => _onTabTapped(3),
            ),
          ],
        ),
      ),
    );
  }
}

class _BerandaTab extends StatefulWidget {
  const _BerandaTab();

  @override
  State<_BerandaTab> createState() => _BerandaTabState();
}

class _BerandaTabState extends State<_BerandaTab> {
  String _timeBasedGreeting() {
    final hour = DateTime.now().hour;

    if (hour >= 4 && hour < 11) {
      return 'Selamat Pagi';
    }
    if (hour >= 11 && hour < 15) {
      return 'Selamat Siang';
    }
    if (hour >= 15 && hour < 19) {
      return 'Selamat Sore';
    }
    return 'Selamat Malam';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HomeProvider>().fetchDashboardSummary();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<HomeProvider>();
    final currentUser = context.watch<AuthProvider>().currentUser;
    final userName = (currentUser?.name ?? '').trim();
    final displayName = userName.isEmpty ? 'Member' : userName;
    final greetingText = _timeBasedGreeting();

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: provider.refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 100),
          children: [
            // Header
            Row(
              children: [
                const CircleAvatar(
                  radius: 22,
                  backgroundColor: Color(0xFFDCE6D4),
                  child: Icon(Icons.person, color: Color(0xFF2A332B), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$greetingText,',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF6B7A6D),
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        'Halo, $displayName! 👋',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1A241D),
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => context.push(AppConstants.routeNotifications),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE8EFE1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.notifications_none_rounded,
                      color: Color(0xFF1A241D),
                      size: 22,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            // Points Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0E7326), Color(0xFF2E9A3E)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total Saldo Kamu',
                        style: GoogleFonts.poppins(
                          color: Colors.white70,
                          fontSize: 13,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.star,
                              color: Colors.white,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'LEVEL ${provider.level.toUpperCase()}',
                              style: GoogleFonts.poppins(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        NumberFormat.decimalPattern(
                          'id',
                        ).format(provider.totalPoints),
                        style: GoogleFonts.poppins(
                          fontSize: 36,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text(
                          'Poin',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            color: Colors.white70,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progres Level',
                        style: GoogleFonts.poppins(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        provider.pointsToNextLevel > 0
                            ? '${provider.pointsToNextLevel} poin lagi ke ${provider.nextLevel}'
                            : 'Level tertinggi tercapai',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(40),
                    child: LinearProgressIndicator(
                      value: provider.levelProgress,
                      minHeight: 8,
                      backgroundColor: const Color(0x33000000),
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            // Misi Aktif
            _SectionTitle(
              title: AppConstants.labelMisiAktif,
              actionText: 'Lihat Semua',
              onTap: () => context.push(AppConstants.routeMisi),
            ),
            const SizedBox(height: 12),
            if (provider.activeMissions.isEmpty)
              const _EmptyText(text: 'Belum ada misi aktif')
            else
              ...provider.activeMissions.map(_MissionCard.new),
            const SizedBox(height: 20),
            // Riwayat Setoran
            _SectionTitle(
              title: AppConstants.labelRiwayatSetoran,
              actionText: 'Lihat Semua',
              onTap: () => context.push(AppConstants.routeRiwayatSetoran),
            ),
            const SizedBox(height: 12),
            if (provider.recentDeposits.isEmpty)
              const _EmptyText(text: 'Belum ada riwayat setoran')
            else
              ...provider.recentDeposits.map(_DepositCard.new),
          ],
        ),
      ),
    );
  }
}

class _MissionCard extends StatelessWidget {
  final MissionModel mission;

  const _MissionCard(this.mission);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: Color(0xFFC6DAC0),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.recycling,
              color: Color(0xFF0D7026),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        mission.title,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFCDE6C3),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '+${mission.pointsReward} poin',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF0C6D23),
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: LinearProgressIndicator(
                    value: mission.progress,
                    minHeight: 6,
                    backgroundColor: const Color(0xFFD1DAC8),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFF157C2D),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DepositCard extends StatelessWidget {
  final DepositModel deposit;

  const _DepositCard(this.deposit);

  @override
  Widget build(BuildContext context) {
    final statusText = switch (deposit.status) {
      DepositStatus.verified => 'TERVALIDASI',
      DepositStatus.rejected => 'DITOLAK',
      DepositStatus.pending => 'MENUNGGU',
    };

    final statusColor = switch (deposit.status) {
      DepositStatus.verified => const Color(0xFFBFEBC8),
      DepositStatus.rejected => const Color(0xFFF3CCC8),
      DepositStatus.pending => const Color(0xFFDDE4D5),
    };

    final statusTextColor = switch (deposit.status) {
      DepositStatus.verified => const Color(0xFF0C6D23),
      DepositStatus.rejected => const Color(0xFFCC3333),
      DepositStatus.pending => const Color(0xFF4A5A4B),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F3EC),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(
              color: Color(0xFFD9E5D3),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.eco, color: Color(0xFF116F2B), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  deposit.wasteType,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '${deposit.weightKg.toStringAsFixed(1)}kg  •  Hari ini',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF6B7A6D),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              statusText,
              style: GoogleFonts.poppins(
                color: statusTextColor,
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final String? actionText;
  final VoidCallback? onTap;

  const _SectionTitle({required this.title, this.actionText, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1C261F),
            ),
          ),
        ),
        if (actionText != null)
          TextButton(
            onPressed: onTap,
            child: Text(
              actionText!,
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F6C25),
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
      ],
    );
  }
}

class _EmptyText extends StatelessWidget {
  final String text;

  const _EmptyText({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        text,
        style: GoogleFonts.poppins(
          color: const Color(0xFF6B7A6D),
          fontSize: 13,
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF1A7A2C) : Colors.transparent,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: selected ? Colors.white : const Color(0xFF8A918A),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 11,
                color: selected ? Colors.white : const Color(0xFF8A918A),
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
