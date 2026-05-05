import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/features/riwayat/riwayat_provider.dart';
import 'package:sirkula/models/deposit_model.dart';

class RiwayatSetoranScreen extends StatefulWidget {
  const RiwayatSetoranScreen({super.key});

  @override
  State<RiwayatSetoranScreen> createState() => _RiwayatSetoranScreenState();
}

class _RiwayatSetoranScreenState extends State<RiwayatSetoranScreen> {
  String _filter = 'Semua';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RiwayatProvider>().fetchRiwayat();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RiwayatProvider>();
    final list = provider.byWasteType(_filter);

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
                Text(
                  'Riwayat Setoran',
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
                  child: Icon(Icons.person, color: Color(0xFF2A332B), size: 20),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Summary Card
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
                    'Total Waste Recycled',
                    style: GoogleFonts.poppins(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${provider.totalWeight.toStringAsFixed(1)} kg',
                    style: GoogleFonts.poppins(
                      fontSize: 36,
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
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.monetization_on, color: Colors.white, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          '${NumberFormat.decimalPattern('id').format(provider.totalPoints)} Poin',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            // Filter Chips
            Row(
              children: [
                _TypeChip(
                  text: 'Semua',
                  selected: _filter == 'Semua',
                  onTap: () => setState(() => _filter = 'Semua'),
                ),
                const SizedBox(width: 8),
                _TypeChip(
                  text: 'Plastik',
                  selected: _filter == 'Plastik',
                  onTap: () => setState(() => _filter = 'Plastik'),
                ),
                const SizedBox(width: 8),
                _TypeChip(
                  text: 'Kertas',
                  selected: _filter == 'Kertas',
                  onTap: () => setState(() => _filter = 'Kertas'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (provider.isLoading)
              const Center(child: CircularProgressIndicator())
            else if (list.isEmpty)
              const _EmptyRiwayat()
            else
              ...list.map(_DepositItem.new),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: const Color(0xFF1A7A2C),
        child: const Icon(Icons.search, color: Colors.white),
      ),
    );
  }
}

class _DepositItem extends StatelessWidget {
  final DepositModel deposit;

  const _DepositItem(this.deposit);

  @override
  Widget build(BuildContext context) {
    final pointsColor = deposit.status == DepositStatus.verified
        ? const Color(0xFF1A7A2C)
        : const Color(0xFF7A8477);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(
              color: Color(0xFFB8E8D8),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _iconByType(deposit.wasteType),
              color: const Color(0xFF0F6C63),
              size: 20,
            ),
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
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  '${_safeDate(deposit.createdAt)} • ${deposit.weightKg.toStringAsFixed(1)} kg',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF6B7A6D),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '+${deposit.pointsEarned} Poin',
                style: GoogleFonts.poppins(
                  color: pointsColor,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: deposit.status == DepositStatus.verified
                      ? const Color(0xFFB9E9B8)
                      : const Color(0xFFDDE4D5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  deposit.status == DepositStatus.verified
                      ? 'TERVALIDASI'
                      : 'MENUNGGU',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF2A4E2A),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String text;
  final bool selected;
  final VoidCallback onTap;

  const _TypeChip({
    required this.text,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF1A7A2C) : const Color(0xFFDDE4D5),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(
          text,
          style: GoogleFonts.poppins(
            color: selected ? Colors.white : const Color(0xFF3E4740),
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _EmptyRiwayat extends StatelessWidget {
  const _EmptyRiwayat();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        'Belum ada riwayat setoran',
        style: GoogleFonts.poppins(
          color: const Color(0xFF6B7A6D),
          fontSize: 13,
        ),
      ),
    );
  }
}

String _safeDate(DateTime? date) {
  if (date == null) {
    return '-';
  }
  try {
    return DateFormat('dd MMM', 'id_ID').format(date);
  } catch (_) {
    return DateFormat('dd MMM').format(date);
  }
}

IconData _iconByType(String type) {
  switch (type.toLowerCase()) {
    case 'kertas':
      return Icons.description_outlined;
    case 'logam':
      return Icons.precision_manufacturing_outlined;
    case 'kaca':
      return Icons.wine_bar_outlined;
    default:
      return Icons.eco;
  }
}
