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
import 'package:sirkula/models/redemption_model.dart';
import 'package:sirkula/models/reward_model.dart';

class RewardScreen extends StatefulWidget {
  const RewardScreen({super.key});

  @override
  State<RewardScreen> createState() => _RewardScreenState();
}

class _RewardScreenState extends State<RewardScreen> {
  int _selectedTab = 0; // 0: Katalog, 1: Leaderboard, 2: Riwayat

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RewardProvider>().fetchRewards();
    });
  }

  void _onTabChanged(int index) {
    if (_selectedTab == index) return;
    setState(() {
      _selectedTab = index;
    });

    if (index == 1) {
      final leaderboardProvider = context.read<LeaderboardProvider>();
      if (leaderboardProvider.entries.isEmpty && !leaderboardProvider.isLoading) {
        leaderboardProvider.fetchLeaderboard();
      }
    } else if (index == 2) {
      context.read<RewardProvider>().fetchMyRedemptions();
    }
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
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFE1E8DA),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _HeaderTab(
                      text: 'Katalog',
                      selected: _selectedTab == 0,
                      onTap: () => _onTabChanged(0),
                    ),
                  ),
                  Expanded(
                    child: _HeaderTab(
                      text: 'Leaderboard',
                      selected: _selectedTab == 1,
                      onTap: () => _onTabChanged(1),
                    ),
                  ),
                  Expanded(
                    child: _HeaderTab(
                      text: 'Riwayat',
                      selected: _selectedTab == 2,
                      onTap: () => _onTabChanged(2),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_selectedTab == 0)
              _RewardCatalogView(
                key: const ValueKey('catalog'),
                homeProvider: homeProvider,
                rewardProvider: rewardProvider,
                onRedeem: _redeemReward,
              )
            else if (_selectedTab == 1)
              const _RewardLeaderboardView(key: ValueKey('leaderboard'))
            else
              _RewardHistoryView(
                key: const ValueKey('history'),
                rewardProvider: rewardProvider,
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
      ],
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

class _RewardHistoryView extends StatelessWidget {
  final RewardProvider rewardProvider;

  const _RewardHistoryView({
    super.key,
    required this.rewardProvider,
  });

  @override
  Widget build(BuildContext context) {
    if (rewardProvider.isLoadingRedemptions) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    final redemptions = rewardProvider.myRedemptions;

    if (redemptions.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFFE8EFE1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          children: [
            const Icon(Icons.history_outlined, size: 48, color: Color(0xFF7A8C78)),
            const SizedBox(height: 12),
            Text(
              'Belum ada riwayat penukaran',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 15,
                color: const Color(0xFF2A332B),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Poin yang kamu kumpulkan bisa ditukarkan dengan berbagai reward menarik!',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: const Color(0xFF6B7A6D),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Riwayat Penukaran Reward',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF116E27),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Daftar klaim reward dan status validasinya.',
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: const Color(0xFF6B7A6D),
          ),
        ),
        const SizedBox(height: 14),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: redemptions.length,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final item = redemptions[index];
            final statusText = switch (item.status) {
              RedemptionStatus.approved => 'DISETUJUI',
              RedemptionStatus.rejected => 'DITOLAK',
              RedemptionStatus.pending => 'MENUNGGU VALIDASI',
            };
            final statusBg = switch (item.status) {
              RedemptionStatus.approved => const Color(0xFFDEF7EC),
              RedemptionStatus.rejected => const Color(0xFFFDE8E8),
              RedemptionStatus.pending => const Color(0xFFFEF08A),
            };
            final statusTextColor = switch (item.status) {
              RedemptionStatus.approved => const Color(0xFF03543F),
              RedemptionStatus.rejected => const Color(0xFF9B1C1C),
              RedemptionStatus.pending => const Color(0xFF713F12),
            };

            final dateStr = item.createdAt != null
                ? DateFormat('dd MMM yyyy, HH:mm', 'id_ID').format(item.createdAt!)
                : '-';

            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F1DC),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.card_giftcard,
                          color: Color(0xFF1A7A2C),
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.reward?.name ?? 'Reward #${item.rewardId}',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                                color: const Color(0xFF1A241D),
                              ),
                            ),
                            Text(
                              dateStr,
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                color: const Color(0xFF7A8C78),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          statusText,
                          style: GoogleFonts.poppins(
                            color: statusTextColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1, color: Color(0xFFEEF2E8)),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.confirmation_number_outlined, size: 16, color: Color(0xFF6B7A6D)),
                          const SizedBox(width: 4),
                          Text(
                            'Kode: ${item.redemptionCode}',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2A332B),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '-${item.pointsSpent} Poin',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFD32F2F),
                        ),
                      ),
                    ],
                  ),
                  if (item.rejectionReason != null && item.rejectionReason!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDF2F2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Alasan penolakan: ${item.rejectionReason}',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: const Color(0xFF9B1C1C),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

