import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/auth/auth_provider.dart';
import 'package:sirkula/features/profil/profil_provider.dart';

class ProfilScreen extends StatefulWidget {
  const ProfilScreen({super.key});

  @override
  State<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends State<ProfilScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProfilProvider>().fetchProfile();
    });
  }

  /// Shows logout confirmation and handles sign-out.
  Future<void> _logout() async {
    final authProvider = context.read<AuthProvider>();
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Keluar Akun'),
          content: const Text('Yakin ingin keluar dari akun ini?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Batal'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Keluar'),
            ),
          ],
        );
      },
    );

    if (shouldLogout != true) {
      return;
    }

    await authProvider.logout();
    if (!mounted) {
      return;
    }
    context.go(AppConstants.routeLogin);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProfilProvider>();
    final user = provider.userModel;
    final badgeItems = _buildBadgeItems(provider.earnedBadges);
    final topBadges = badgeItems.take(4).toList();
    final profileName = (user?.name ?? '').trim().isEmpty
        ? 'Member Sirkula'
        : user!.name;
    final accountCode = user == null
        ? '-'
        : 'BS-${user.id.toString().padLeft(4, '0')}-00${user.id.toString().padLeft(3, '0')}';

    return SafeArea(
      child: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 140),
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'User Profile',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F6F25),
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const CircleAvatar(
                      radius: 20,
                      backgroundColor: Color(0xFFDCE6D4),
                      child: Icon(
                        Icons.person,
                        color: Color(0xFF2A332B),
                        size: 20,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Profile Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0E7326), Color(0xFF2E9A3E)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    children: [
                      // Avatar
                      Stack(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFF6CD57A),
                                width: 3,
                              ),
                            ),
                            child: const CircleAvatar(
                              radius: 44,
                              backgroundColor: Color(0xFFBDD9BE),
                              child: Icon(
                                Icons.person,
                                size: 44,
                                color: Color(0xFF145021),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Color(0xFF6FE099),
                                shape: BoxShape.circle,
                              ),
                              padding: const EdgeInsets.all(5),
                              child: const Icon(
                                Icons.edit,
                                size: 14,
                                color: Color(0xFF145021),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        profileName,
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ID:  $accountCode',
                        style: GoogleFonts.poppins(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 12,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD3ED95),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          '⭐ LEVEL ${provider.level.toUpperCase()}',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF264116),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                // Stats Row
                Row(
                  children: [
                    _StatCard(
                      value: '${provider.totalDeposits}',
                      label: 'SETORAN',
                    ),
                    const SizedBox(width: 8),
                    _StatCard(
                      value: NumberFormat.decimalPattern(
                        'id',
                      ).format(provider.totalPoints),
                      label: 'POIN',
                    ),
                    const SizedBox(width: 8),
                    _StatCard(
                      value: '${provider.badgesEarned}',
                      label: 'BADGE',
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                // Badge Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Badge Saya',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (topBadges.isNotEmpty)
                      Text(
                        'Tertinggi: ${topBadges.first.title}',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF0F6E25),
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                if (topBadges.isEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8EFE1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      'Belum ada badge yang didapat.',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF5D6F60),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  )
                else
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: topBadges
                        .map((badge) => _Badge(badge: badge))
                        .toList(),
                  ),
                const SizedBox(height: 18),
                // Action Menu
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F5F3),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Column(
                    children: [
                      _ActionTile(
                        icon: Icons.person_search,
                        title: 'Edit Profil',
                        onTap: () => context.push(
                          AppConstants.routeEditProfile,
                          extra: user,
                        ),
                      ),
                      _ActionTile(
                        icon: Icons.history,
                        title: 'Riwayat Setoran',
                        onTap: () =>
                            context.push(AppConstants.routeRiwayatSetoran),
                      ),
                      _ActionTile(
                        icon: Icons.help_outline,
                        title: 'Bantuan',
                        onTap: () =>
                            context.push(AppConstants.routeSupportCenter),
                      ),
                      _ActionTile(
                        icon: Icons.logout,
                        title: 'Keluar',
                        titleColor: const Color(0xFFD32F2F),
                        iconColor: const Color(0xFFD32F2F),
                        onTap: _logout,
                        showDivider: false,
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;

  const _StatCard({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFE8EFE1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF116E27),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                color: const Color(0xFF6B7A6D),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final _BadgeItem badge;

  const _Badge({required this.badge});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 72,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: badge.color,
              shape: BoxShape.circle,
            ),
            child: Icon(badge.icon, size: 22, color: const Color(0xFF0D6F25)),
          ),
          const SizedBox(height: 6),
          Text(
            badge.title,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 11,
              color: const Color(0xFF2A332B),
            ),
          ),
          if (badge.subtitle.isNotEmpty)
            Text(
              badge.subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w500,
                fontSize: 9,
                color: const Color(0xFF6B7A6D),
              ),
            ),
        ],
      ),
    );
  }
}

class _BadgeItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _BadgeItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });
}

List<_BadgeItem> _buildBadgeItems(List<Map<String, dynamic>> earnedBadges) {
  final sorted = [...earnedBadges]
    ..sort((a, b) {
      final aScore = _badgePriority(a);
      final bScore = _badgePriority(b);
      return bScore.compareTo(aScore);
    });

  return sorted.map((raw) {
    final rawBadge = raw['badge'];
    final badgeMap = rawBadge is Map
        ? Map<String, dynamic>.from(rawBadge)
        : <String, dynamic>{};

    final name =
        badgeMap['name']?.toString() ?? raw['name']?.toString() ?? 'Badge';
    final conditionType =
        badgeMap['condition_type']?.toString().toLowerCase() ?? '';
    final conditionValue =
        (badgeMap['condition_value'] as num?)?.toDouble() ?? 0;

    return _BadgeItem(
      title: _shortBadgeTitle(name),
      subtitle: _badgeSubtitle(conditionType, conditionValue),
      icon: _badgeIcon(name, conditionType),
      color: _badgeColor(name, conditionType),
    );
  }).toList();
}

int _badgePriority(Map<String, dynamic> raw) {
  final rawBadge = raw['badge'];
  final badgeMap = rawBadge is Map
      ? Map<String, dynamic>.from(rawBadge)
      : <String, dynamic>{};

  final name = badgeMap['name']?.toString().toLowerCase() ?? '';
  final conditionType =
      badgeMap['condition_type']?.toString().toLowerCase() ?? '';
  final conditionValue = (badgeMap['condition_value'] as num?)?.toInt() ?? 0;
  final earnedAt = DateTime.tryParse(raw['earned_at']?.toString() ?? '');
  final earnedWeight = earnedAt?.millisecondsSinceEpoch ?? 0;

  var typeWeight = 0;
  if (name.contains('platinum')) {
    typeWeight = 4_000_000;
  } else if (name.contains('gold')) {
    typeWeight = 3_000_000;
  } else if (name.contains('silver')) {
    typeWeight = 2_000_000;
  } else if (name.contains('bronze') || name.contains('pemula')) {
    typeWeight = 1_000_000;
  } else if (conditionType == 'points') {
    typeWeight = 900_000;
  } else if (conditionType == 'total_weight') {
    typeWeight = 600_000;
  } else if (conditionType == 'deposit_count') {
    typeWeight = 300_000;
  }

  return typeWeight + conditionValue + (earnedWeight ~/ 1000000);
}

String _shortBadgeTitle(String name) {
  if (name.startsWith('Badge Level ')) {
    return name.replaceFirst('Badge Level ', '');
  }
  return name;
}

String _badgeSubtitle(String conditionType, double value) {
  final valueText = value % 1 == 0
      ? value.toInt().toString()
      : value.toStringAsFixed(1);
  switch (conditionType) {
    case 'points':
      return '$valueText poin';
    case 'total_weight':
      return '$valueText kg';
    case 'deposit_count':
      return '$valueText setoran';
    default:
      return '';
  }
}

IconData _badgeIcon(String name, String conditionType) {
  final lowerName = name.toLowerCase();
  if (lowerName.contains('platinum')) return Icons.workspace_premium_rounded;
  if (lowerName.contains('gold')) return Icons.emoji_events_rounded;
  if (lowerName.contains('silver')) return Icons.military_tech_rounded;
  if (lowerName.contains('bronze') || lowerName.contains('pemula'))
    return Icons.eco_rounded;

  switch (conditionType) {
    case 'points':
      return Icons.stars_rounded;
    case 'total_weight':
      return Icons.scale_rounded;
    case 'deposit_count':
      return Icons.recycling_rounded;
    default:
      return Icons.workspace_premium_outlined;
  }
}

Color _badgeColor(String name, String conditionType) {
  final lowerName = name.toLowerCase();
  if (lowerName.contains('platinum')) return const Color(0xFFDDE3F5);
  if (lowerName.contains('gold')) return const Color(0xFFF7EDBD);
  if (lowerName.contains('silver')) return const Color(0xFFE5EAEE);
  if (lowerName.contains('bronze') || lowerName.contains('pemula')) {
    return const Color(0xFFE9DFC9);
  }

  switch (conditionType) {
    case 'points':
      return const Color(0xFFE8DEF7);
    case 'total_weight':
      return const Color(0xFFCDEDE4);
    case 'deposit_count':
      return const Color(0xFFD9EEB8);
    default:
      return const Color(0xFFD6E2D0);
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color? iconColor;
  final Color? titleColor;
  final VoidCallback? onTap;
  final bool showDivider;

  const _ActionTile({
    required this.icon,
    required this.title,
    this.iconColor,
    this.titleColor,
    this.onTap,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          leading: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFE8EFE1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 18,
              color: iconColor ?? const Color(0xFF1A7A2C),
            ),
          ),
          title: Text(
            title,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: titleColor ?? const Color(0xFF1F2921),
            ),
          ),
          trailing: Icon(
            Icons.chevron_right,
            size: 20,
            color: const Color(0xFF9AA898),
          ),
          onTap: onTap,
        ),
        if (showDivider)
          const Divider(
            height: 1,
            indent: 16,
            endIndent: 16,
            color: Color(0xFFE8EFE1),
          ),
      ],
    );
  }
}
