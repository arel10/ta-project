import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/home/home_provider.dart';
import 'package:sirkula/features/reward/leaderboard_provider.dart';
import 'package:sirkula/features/reward/reward_leaderboard_screen.dart';
import 'package:sirkula/features/reward/reward_provider.dart';
import 'package:sirkula/models/reward_model.dart';

class RewardScreen extends StatefulWidget {
  const RewardScreen({super.key});

  @override
  State<RewardScreen> createState() => _RewardScreenState();
}

class _RewardScreenState extends State<RewardScreen> {
  bool _showLeaderboard = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RewardProvider>().fetchRewards();
    });
  }

  void _openLeaderboardTab() {
    if (_showLeaderboard) {
      return;
    }

    setState(() {
      _showLeaderboard = true;
    });

    final leaderboardProvider = context.read<LeaderboardProvider>();
    if (leaderboardProvider.entries.isEmpty && !leaderboardProvider.isLoading) {
      leaderboardProvider.fetchLeaderboard();
    }
  }

  void _openCatalogTab() {
    if (!_showLeaderboard) {
      return;
    }

    setState(() {
      _showLeaderboard = false;
    });
  }

  /// Confirms redemption and executes provider call.
  Future<void> _redeemReward(RewardModel reward) async {
    final rewardProvider = context.read<RewardProvider>();
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Konfirmasi Penukaran'),
          content: Text(
            'Tukar reward ${reward.name} seharga ${reward.pointsCost} poin?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Batal'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Tukar'),
            ),
          ],
        );
      },
    );

    if (accepted != true) {
      return;
    }

    try {
      final result = await rewardProvider.redeemReward(reward.id);
      if (!mounted) {
        return;
      }
      await showDialog<void>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Klaim Reward Diajukan'),
            content: Text(
              '${result.message}\n\n'
              'Status: Menunggu validasi admin.\n'
              'Kode klaim: ${result.redemptionCode}\n\n'
              'Klaim reward dilakukan di:\n'
              '${result.pickupLocation}',
            ),
            actions: [
              FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Mengerti'),
              ),
            ],
          );
        },
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(rewardProvider.errorMessage ?? 'Penukaran gagal'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final rewardProvider = context.watch<RewardProvider>();
    final homeProvider = context.watch<HomeProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF2F7ED),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 140),
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Rewards & Leaderboard',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF106E26),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
                const CircleAvatar(
                  radius: 20,
                  backgroundColor: Color(0xFFDCE6D4),
                  child: Icon(Icons.person, color: Color(0xFF2A332B), size: 20),
                ),
              ],
            ),
            const SizedBox(height: 14),
            // Tab Toggle
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: const Color(0xFFE1E8DA),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _HeaderTab(
                      text: 'Katalog Reward',
                      selected: !_showLeaderboard,
                      onTap: _openCatalogTab,
                    ),
                  ),
                  Expanded(
                    child: _HeaderTab(
                      text: 'Leaderboard',
                      selected: _showLeaderboard,
                      onTap: _openLeaderboardTab,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 260),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              transitionBuilder: (child, animation) {
                final isLeaderboardChild =
                    child.key == const ValueKey<String>('leaderboard');
                final isIncoming =
                    (isLeaderboardChild && _showLeaderboard) ||
                    (!isLeaderboardChild && !_showLeaderboard);

                final incomingBegin = _showLeaderboard
                    ? const Offset(0.08, 0)
                    : const Offset(-0.08, 0);
                final outgoingEnd = _showLeaderboard
                    ? const Offset(-0.08, 0)
                    : const Offset(0.08, 0);

                final curvedAnimation = CurvedAnimation(
                  parent: animation,
                  curve: isIncoming ? Curves.easeOutCubic : Curves.easeInCubic,
                );

                final slideAnimation = Tween<Offset>(
                  begin: isIncoming ? incomingBegin : Offset.zero,
                  end: isIncoming ? Offset.zero : outgoingEnd,
                ).animate(curvedAnimation);

                return FadeTransition(
                  opacity: curvedAnimation,
                  child: SlideTransition(
                    position: slideAnimation,
                    child: child,
                  ),
                );
              },
              child: _showLeaderboard
                  ? const _RewardLeaderboardView(key: ValueKey('leaderboard'))
                  : _RewardCatalogView(
                      key: const ValueKey('catalog'),
                      homeProvider: homeProvider,
                      rewardProvider: rewardProvider,
                      onRedeem: _redeemReward,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RewardLeaderboardView extends StatelessWidget {
  const _RewardLeaderboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return const RewardLeaderboardContent();
  }
}

class _RewardCatalogView extends StatelessWidget {
  final HomeProvider homeProvider;
  final RewardProvider rewardProvider;
  final Future<void> Function(RewardModel reward) onRedeem;

  const _RewardCatalogView({
    super.key,
    required this.homeProvider,
    required this.rewardProvider,
    required this.onRedeem,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0E7326), Color(0xFF2E9A3E)],
            ),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'SALDO KAMU',
                style: GoogleFonts.poppins(
                  color: Colors.white70,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(
                    Icons.payments,
                    color: Color(0xFFF9DD4A),
                    size: 28,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    NumberFormat.decimalPattern(
                      'id',
                    ).format(homeProvider.totalPoints),
                    style: GoogleFonts.poppins(
                      fontSize: 32,
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Poin',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.eco, color: Colors.white, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      'Tingkatkan Impact Kamu!',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'Tukar Poin',
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF116E27),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'Pilih reward ramah lingkungan favoritmu.',
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: const Color(0xFF6B7A6D),
            ),
          ),
        ),
        const SizedBox(height: 14),
        if (rewardProvider.isLoading)
          const Center(child: CircularProgressIndicator())
        else if (rewardProvider.rewards.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFE8EFE1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              'Belum ada reward yang tersedia',
              style: GoogleFonts.poppins(
                color: const Color(0xFF6B7A6D),
                fontSize: 13,
              ),
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: rewardProvider.rewards.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              mainAxisExtent: 230,
            ),
            itemBuilder: (context, index) {
              final reward = rewardProvider.rewards[index];
              return _RewardCard(
                reward: reward,
                isRedeeming: rewardProvider.isRedeeming,
                onRedeem: () => onRedeem(reward),
                onTap: () =>
                    context.push(AppConstants.routeRewardDetail, extra: reward),
                showPopular: index == 0,
              );
            },
          ),
        const SizedBox(height: 20),
        _UndanganKhususBanner(),
      ],
    );
  }
}

class _UndanganKhususBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F1DC),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: Color(0xFFCDE6C3),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.mark_email_read,
              color: Color(0xFF2A7C3F),
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Undangan Khusus',
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF13662B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Bagikan kode referalmu & dapatkan 200 poin tambahan untuk setiap teman!',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF6B7A6D),
                    fontSize: 12,
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

class _HeaderTab extends StatelessWidget {
  final String text;
  final bool selected;
  final VoidCallback? onTap;

  const _HeaderTab({required this.text, required this.selected, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF1A7A2C) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: GoogleFonts.poppins(
            color: selected ? Colors.white : const Color(0xFF445246),
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  final RewardModel reward;
  final bool isRedeeming;
  final VoidCallback onRedeem;
  final VoidCallback onTap;
  final bool showPopular;

  const _RewardCard({
    required this.reward,
    required this.isRedeeming,
    required this.onRedeem,
    required this.onTap,
    this.showPopular = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF4F4F2),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(18),
                    ),
                    child: reward.imageUrl.isEmpty
                        ? Container(
                            color: const Color(0xFFDDE5D5),
                            alignment: Alignment.center,
                            child: const Icon(
                              Icons.card_giftcard,
                              size: 36,
                              color: Color(0xFF5A675A),
                            ),
                          )
                        : CachedNetworkImage(
                            imageUrl: reward.imageUrl,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            placeholder: (context, url) => Container(
                              color: const Color(0xFFDDE5D5),
                              alignment: Alignment.center,
                              child: const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              color: const Color(0xFFDDE5D5),
                              alignment: Alignment.center,
                              child: const Icon(
                                Icons.broken_image_outlined,
                                size: 34,
                                color: Color(0xFF5A675A),
                              ),
                            ),
                          ),
                  ),
                  if (showPopular)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE85D2C),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'POPULER',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reward.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(
                        Icons.monetization_on,
                        color: Color(0xFF12782B),
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${reward.pointsCost} Poin',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF12782B),
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    width: double.infinity,
                    height: 32,
                    child: ElevatedButton(
                      onPressed: isRedeeming ? null : onRedeem,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD8DFD2),
                        foregroundColor: const Color(0xFF2D3A2E),
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        elevation: 0,
                      ),
                      child: isRedeeming
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              'Tukar',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
