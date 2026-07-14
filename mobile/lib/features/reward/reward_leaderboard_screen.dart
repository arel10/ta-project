import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/features/auth/auth_provider.dart';
import 'package:sirkula/features/reward/leaderboard_provider.dart';

class RewardLeaderboardScreen extends StatefulWidget {
  const RewardLeaderboardScreen({super.key});

  @override
  State<RewardLeaderboardScreen> createState() =>
      _RewardLeaderboardScreenState();
}

class _RewardLeaderboardScreenState extends State<RewardLeaderboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LeaderboardProvider>().fetchLeaderboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F7ED),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
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
                      color: const Color(0xFF0F6E25),
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
                    child: InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          'Katalog Reward',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF445246),
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1A7A2C),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        'Leaderboard',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            const RewardLeaderboardContent(),
          ],
        ),
      ),
    );
  }
}

class RewardLeaderboardContent extends StatelessWidget {
  const RewardLeaderboardContent({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LeaderboardProvider>();
    final authProvider = context.watch<AuthProvider>();
    final entries = provider.entries;
    final currentUser = authProvider.currentUser;
    final currentUserId = currentUser?.id;
    LeaderboardEntry? currentUserEntry;
    if (currentUserId != null) {
      for (final item in entries) {
        if (item.userId == currentUserId) {
          currentUserEntry = item;
          break;
        }
      }
    }
    final currentUserRank = currentUserEntry?.rank ?? provider.currentUserRank;
    final currentUserName = (currentUser?.name ?? currentUserEntry?.name ?? '')
        .trim();
    final currentUserPoints =
        currentUserEntry?.totalPoints ?? currentUser?.points;

    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (entries.isEmpty) {
      return const _EmptyLeaderboard();
    }

    return Column(
      children: [
        _TopThree(entries: entries.take(3).toList()),
        const SizedBox(height: 10),
        Container(
          height: 80,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF2E9A3E), Color(0xFF1A7A2C)],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(
            child: Icon(
              Icons.eco_outlined,
              color: Colors.white.withValues(alpha: 0.2),
              size: 28,
            ),
          ),
        ),
        const SizedBox(height: 20),
        Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'COMMUNITY RANKINGS',
            style: GoogleFonts.poppins(
              letterSpacing: 2,
              color: const Color(0xFF7D8678),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(height: 12),
        ...entries.skip(3).map((item) {
          final isCurrentUser =
              currentUserId != null && item.userId == currentUserId;
          return _RankTile(item: item, highlight: isCurrentUser);
        }),
        if (currentUserRank != null &&
            currentUserName.isNotEmpty &&
            currentUserPoints != null) ...[
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'YOUR RANKING',
              style: GoogleFonts.poppins(
                letterSpacing: 2,
                color: const Color(0xFF7D8678),
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 12),
          _CurrentUserRankTile(
            rank: currentUserRank,
            name: '$currentUserName (Anda)',
            points: currentUserPoints,
          ),
        ],
      ],
    );
  }
}

class _CurrentUserRankTile extends StatelessWidget {
  final int rank;
  final String name;
  final int points;

  const _CurrentUserRankTile({
    required this.rank,
    required this.name,
    required this.points,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1C4F8C),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 28,
            child: Text(
              '$rank',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            radius: 18,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            child: const Icon(Icons.person, size: 18, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Ranking kamu saat ini',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    color: Colors.white70,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${NumberFormat.decimalPattern('id').format(points)} pts',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _TopThree extends StatelessWidget {
  final List<LeaderboardEntry> entries;

  const _TopThree({required this.entries});

  @override
  Widget build(BuildContext context) {
    final one = entries.isNotEmpty ? entries[0] : null;
    final two = entries.length > 1 ? entries[1] : null;
    final three = entries.length > 2 ? entries[2] : null;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _PodiumUser(entry: two, rank: 2, bottomGap: 28),
        _PodiumUser(entry: one, rank: 1, highlighted: true),
        _PodiumUser(entry: three, rank: 3),
      ],
    );
  }
}

class _PodiumUser extends StatelessWidget {
  final LeaderboardEntry? entry;
  final int rank;
  final bool highlighted;
  final double bottomGap;

  const _PodiumUser({
    required this.entry,
    required this.rank,
    this.highlighted = false,
    this.bottomGap = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (entry == null) {
      return const SizedBox(width: 95);
    }

    return SizedBox(
      width: 100,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          SizedBox(height: bottomGap),
          if (highlighted)
            const Icon(
              Icons.workspace_premium,
              color: Color(0xFFD4A61D),
              size: 28,
            ),
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: _borderColorByRank(rank), width: 3),
                ),
                child: CircleAvatar(
                  radius: highlighted ? 34 : 28,
                  backgroundColor: const Color(0xFFD6E2D0),
                  child: Icon(
                    Icons.person,
                    size: highlighted ? 34 : 26,
                    color: const Color(0xFF4A5A4B),
                  ),
                ),
              ),
              Positioned(
                bottom: -4,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A7A2C),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Center(
                      child: Text(
                        '$rank',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            entry!.name,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${NumberFormat.decimalPattern('id').format(entry!.totalPoints)} pts',
            style: GoogleFonts.poppins(
              color: const Color(0xFF16732A),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Color _borderColorByRank(int rank) {
    return switch (rank) {
      1 => const Color(0xFFD4A61D),
      2 => const Color(0xFFC0C8D2),
      3 => const Color(0xFFB1784A),
      _ => const Color(0xFF1A7A2C),
    };
  }
}

class _RankTile extends StatelessWidget {
  final LeaderboardEntry item;
  final bool highlight;

  const _RankTile({required this.item, required this.highlight});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: highlight ? const Color(0xFF1A7A2C) : const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 28,
            child: Text(
              '${item.rank}',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: highlight ? Colors.white : const Color(0xFF758070),
              ),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            radius: 18,
            backgroundColor: highlight
                ? Colors.white.withValues(alpha: 0.2)
                : const Color(0xFFD0DAC9),
            child: Icon(
              Icons.person,
              size: 18,
              color: highlight ? Colors.white : const Color(0xFF4A5A4B),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: highlight ? Colors.white : const Color(0xFF1E281F),
                  ),
                ),
                if (highlight)
                  Text(
                    'YOU',
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      color: Colors.white70,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          ),
          Text(
            '${NumberFormat.decimalPattern('id').format(item.totalPoints)} pts',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: highlight ? Colors.white : const Color(0xFF1E281F),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyLeaderboard extends StatelessWidget {
  const _EmptyLeaderboard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        'Data leaderboard belum tersedia',
        style: GoogleFonts.poppins(
          color: const Color(0xFF6B7A6D),
          fontSize: 13,
        ),
      ),
    );
  }
}
