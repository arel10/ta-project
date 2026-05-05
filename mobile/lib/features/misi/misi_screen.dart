import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/features/home/home_provider.dart';
import 'package:sirkula/models/mission_model.dart';

class MisiScreen extends StatefulWidget {
  const MisiScreen({super.key});

  @override
  State<MisiScreen> createState() => _MisiScreenState();
}

class _MisiScreenState extends State<MisiScreen> {
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
    final missions = provider.activeMissions;
    final completedCount = missions.where((m) => m.isCompleted).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF2F7ED),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Misi Aktif',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0E6E25),
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const CircleAvatar(
                  radius: 20,
                  backgroundColor: Color(0xFFDCE6D4),
                  child: Icon(Icons.flag, color: Color(0xFF2A332B), size: 20),
                ),
              ],
            ),
            const SizedBox(height: 16),
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
                    'Progress Misi Kamu',
                    style: GoogleFonts.poppins(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${missions.length} Misi Aktif',
                    style: GoogleFonts.poppins(
                      fontSize: 34,
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '$completedCount selesai',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (provider.isLoading)
              const Center(child: CircularProgressIndicator())
            else if (missions.isEmpty)
              const _EmptyMisi()
            else
              ...missions.map(_MissionTile.new),
          ],
        ),
      ),
    );
  }
}

class _MissionTile extends StatelessWidget {
  final MissionModel mission;

  const _MissionTile(this.mission);

  @override
  Widget build(BuildContext context) {
    final deadline = mission.deadline;
    final deadlineText = deadline == null
        ? 'Tanpa batas waktu'
        : 'Deadline ${DateFormat('dd MMM yyyy', 'id').format(deadline)}';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
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
                child: Text(
                  mission.title,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
          const SizedBox(height: 10),
          Text(
            mission.description,
            style: GoogleFonts.poppins(
              color: const Color(0xFF516051),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            deadlineText,
            style: GoogleFonts.poppins(
              color: const Color(0xFF6B7A6D),
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: mission.progress,
              minHeight: 7,
              backgroundColor: const Color(0xFFD1DAC8),
              valueColor: AlwaysStoppedAnimation<Color>(
                mission.isCompleted
                    ? const Color(0xFF0C6D23)
                    : const Color(0xFF157C2D),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${(mission.progress * 100).toStringAsFixed(0)}% selesai',
            style: GoogleFonts.poppins(
              color: const Color(0xFF4E5A4F),
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyMisi extends StatelessWidget {
  const _EmptyMisi();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          const Icon(Icons.flag_outlined, size: 34, color: Color(0xFF6B7A6D)),
          const SizedBox(height: 8),
          Text(
            'Belum ada misi aktif saat ini',
            style: GoogleFonts.poppins(
              color: const Color(0xFF6B7A6D),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
