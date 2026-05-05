import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/features/reward/reward_provider.dart';
import 'package:sirkula/models/reward_model.dart';

class RewardDetailScreen extends StatelessWidget {
  final RewardModel reward;

  const RewardDetailScreen({super.key, required this.reward});

  /// Performs reward redemption from detail page.
  Future<void> _redeem(BuildContext context) async {
    final provider = context.read<RewardProvider>();

    final approved = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Konfirmasi Penukaran'),
          content: Text(
            'Tukar ${reward.name} seharga ${reward.pointsCost} poin?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Batal'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Tukar'),
            ),
          ],
        );
      },
    );

    if (approved != true) {
      return;
    }

    try {
      final result = await provider.redeemReward(reward.id);
      if (!context.mounted) {
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
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.errorMessage ?? 'Penukaran gagal')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F7ED),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Detail Reward',
                        style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F6E25),
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.share_outlined, size: 22),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Product Image
                  Stack(
                    children: [
                      Container(
                        height: 280,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: const LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Color(0xFF8DC648), Color(0xFFDCEBCF)],
                          ),
                        ),
                        alignment: Alignment.center,
                        child: reward.imageUrl.isEmpty
                            ? const Icon(
                                Icons.card_giftcard,
                                size: 80,
                                color: Color(0xFF245226),
                              )
                            : ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: CachedNetworkImage(
                                  imageUrl: reward.imageUrl,
                                  fit: BoxFit.contain,
                                  height: 200,
                                  width: double.infinity,
                                  placeholder: (context, url) => const SizedBox(
                                    width: 26,
                                    height: 26,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Color(0xFF245226),
                                    ),
                                  ),
                                  errorWidget: (context, url, error) =>
                                      const Icon(
                                        Icons.broken_image_outlined,
                                        size: 72,
                                        color: Color(0xFF245226),
                                      ),
                                ),
                              ),
                      ),
                      // Limited Edition Badge
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE85D2C),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Text(
                            'Limited Edition',
                            style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  // Name & Points overlay
                  Transform.translate(
                    offset: const Offset(0, -20),
                    child: Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F5F4),
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  reward.name,
                                  style: GoogleFonts.poppins(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.eco,
                                      color: Color(0xFF1A7A2C),
                                      size: 14,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Produk Ramah Lingkungan',
                                      style: GoogleFonts.poppins(
                                        color: const Color(0xFF1A7A2C),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${reward.pointsCost}',
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF136E26),
                                ),
                              ),
                              Text(
                                'POIN',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: const Color(0xFF6B7A6D),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Tentang Reward
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 18,
                        decoration: BoxDecoration(
                          color: const Color(0xFF1A7A2C),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Tentang Reward',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    reward.description.isEmpty
                        ? 'Bawa semangat keberlanjutanmu ke mana pun dengan Tumbler Eco Metallic Green. Terbuat dari material food-grade stainless steel berkualitas tinggi yang mampu menjaga suhu minuman Anda tetap dingin selama 24 jam atau panas hingga 12 jam.'
                        : reward.description,
                    style: GoogleFonts.poppins(
                      height: 1.5,
                      color: const Color(0xFF3F4A40),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Feature bullets
                  _FeatureBullet(
                    'Kapasitas 500ml, pas untuk aktivitas harian.',
                  ),
                  _FeatureBullet('BPA-Free dan ramah lingkungan.'),
                  _FeatureBullet('Tahan karat dan awet hingga bertahun-tahun.'),
                  const SizedBox(height: 18),
                  // Cara Penukaran
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8EFE1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Cara Penukaran',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 14),
                        _StepItem(
                          number: '1',
                          title: "Klik 'Tukar Sekarang'",
                          description:
                              'Pastikan saldo poin Anda cukup untuk melakukan penukaran produk ini.',
                        ),
                        const SizedBox(height: 12),
                        _StepItem(
                          number: '2',
                          title: 'Pilih Cabang Waste Bank',
                          description:
                              'Pilih titik penjemputan atau cabang waste bank terdekat dari lokasimu.',
                        ),
                        const SizedBox(height: 12),
                        _StepItem(
                          number: '3',
                          title: 'Tunjukkan QR Code',
                          description:
                              'Kunjungi cabang terpilih dan tunjukkan kode penukaran kepada petugas kami.',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Stock info
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8EFE1),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: const BoxDecoration(
                            color: Color(0xFFCDE6C3),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.inventory_2_outlined,
                            color: Color(0xFF136E26),
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'STOK TERSEDIA',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                                color: const Color(0xFF6B7A6D),
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              '${reward.stock} Unit',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Syarat & Ketentuan
                  Container(
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
                            const Icon(
                              Icons.monetization_on,
                              color: Color(0xFF1A7A2C),
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Syarat & Ketentuan',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        _TermLine(
                          'Poin yang sudah ditukar tidak dapat dikembalikan.',
                        ),
                        _TermLine(
                          'Penukaran barang fisik hanya dilayani di hari kerja.',
                        ),
                        _TermLine(
                          'Warna produk mungkin sedikit berbeda karena pencahayaan.',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Redeem Button
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: reward.stock <= 0 ? null : () => _redeem(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A7A2C),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                    elevation: 4,
                  ),
                  child: Text(
                    'Tukar Sekarang  →',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureBullet extends StatelessWidget {
  final String text;

  const _FeatureBullet(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Icon(Icons.check_circle, color: Color(0xFF1A7A2C), size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: const Color(0xFF3F4A40),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepItem extends StatelessWidget {
  final String number;
  final String title;
  final String description;

  const _StepItem({
    required this.number,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            color: Color(0xFF1A7A2C),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number,
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: const Color(0xFF6B7A6D),
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TermLine extends StatelessWidget {
  final String text;

  const _TermLine(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: GoogleFonts.poppins(
          fontSize: 12,
          color: const Color(0xFF3F4A40),
          height: 1.4,
        ),
      ),
    );
  }
}
