import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/setor/setor_provider.dart';
import 'package:sirkula/models/deposit_model.dart';

class SetorScreen extends StatefulWidget {
  const SetorScreen({super.key});

  @override
  State<SetorScreen> createState() => _SetorScreenState();
}

class _SetorScreenState extends State<SetorScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  String _selectedWasteCode = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<SetorProvider>();
      provider.fetchDepositHistory();
      provider.fetchWastePointRates().then((_) {
        if (!mounted) {
          return;
        }
        final rates = provider.wasteRates;
        if (rates.isNotEmpty) {
          setState(() {
            _selectedWasteCode = rates.first.code;
          });
        }
      });
    });
  }

  @override
  void dispose() {
    _weightController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  /// Validates and sends deposit form to API.
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final provider = context.read<SetorProvider>();
    try {
      final points = await provider.submitDeposit(
        wasteCode: _selectedWasteCode,
        weightKg: double.parse(_weightController.text),
        notes: _notesController.text,
      );

      if (!mounted) {
        return;
      }

      await showDialog<void>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Setoran berhasil dikirim'),
            content: Text(
              'Setoran kamu berhasil dikirim. Poin didapat: $points',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('OK'),
              ),
            ],
          );
        },
      );

      _formKey.currentState!.reset();
      _weightController.clear();
      _notesController.clear();
      setState(() {
        _selectedWasteCode = provider.wasteRates.isNotEmpty
            ? provider.wasteRates.first.code
            : '';
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Gagal mengirim setoran'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SetorProvider>();
    final selectedRate = provider.wasteRates.where(
      (r) => r.code == _selectedWasteCode,
    );
    final currentRate = selectedRate.isNotEmpty ? selectedRate.first : null;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 140),
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Waste Deposit Form',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF116E26),
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
          // Banner Image
          Container(
            height: 150,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              image: const DecorationImage(
                fit: BoxFit.cover,
                image: NetworkImage(
                  'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=900',
                ),
              ),
            ),
            alignment: Alignment.bottomLeft,
            padding: const EdgeInsets.all(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFB6E55B),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'LANGKAH HIJAU',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Form Container
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 20),
            decoration: BoxDecoration(
              color: const Color(0xFFF0F5EA),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Jenis Sampah',
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF4A554A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedWasteCode.isEmpty
                        ? null
                        : _selectedWasteCode,
                    icon: const Icon(
                      Icons.keyboard_arrow_down,
                      color: Color(0xFF4A554A),
                    ),
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF2E382E),
                    ),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(
                        Icons.recycling,
                        color: Color(0xFF1A7A2C),
                        size: 20,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFE3EAD8),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 14,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    items: provider.wasteRates
                        .map(
                          (rate) => DropdownMenuItem<String>(
                            value: rate.code,
                            child: Text(rate.displayLabel),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _selectedWasteCode = value;
                        });
                      }
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Pilih jenis sampah';
                      }
                      return null;
                    },
                  ),
                  if (currentRate != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Tarif saat ini: ${currentRate.pointsPerKg} poin/kg',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1A7A2C),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Text(
                    'Estimasi Berat (kg)',
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF4A554A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _weightController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF2E382E),
                    ),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(
                        Icons.scale_outlined,
                        color: Color(0xFF1A7A2C),
                        size: 20,
                      ),
                      suffixText: 'KG',
                      suffixStyle: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF2E382E),
                        fontSize: 14,
                      ),
                      hintText: '0.0',
                      hintStyle: GoogleFonts.poppins(
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF9AA898),
                        fontSize: 14,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFE3EAD8),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 14,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    validator: (value) {
                      final parsed = double.tryParse(value ?? '');
                      if (parsed == null) {
                        return 'Masukkan angka berat';
                      }
                      if (parsed <= 0) {
                        return 'Berat harus lebih dari 0';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Catatan (opsional)',
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF4A554A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _notesController,
                    minLines: 3,
                    maxLines: 4,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF2E382E),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Contoh: Botol sudah dibersihkan',
                      hintStyle: GoogleFonts.poppins(
                        fontWeight: FontWeight.w400,
                        color: const Color(0xFF9AA898),
                        fontSize: 14,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFE3EAD8),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Info Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFE2F4D9),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFBCE3AA), width: 1),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Icon(
                    Icons.pin_drop,
                    color: Color(0xFF136829),
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Poin akan dihitung setelah admin\nmemvalidasi setoran kamu',
                    style: GoogleFonts.poppins(
                      color: const Color(0xFF136829),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: provider.isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A7A2C),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
                elevation: 4,
              ),
              child: provider.isSubmitting
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : Text(
                      AppConstants.labelKirimSetoran,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 24),
          // Pending deposits
          Text(
            'Setoran Menunggu Validasi',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1D251E),
            ),
          ),
          const SizedBox(height: 14),
          if (provider.depositHistory.isEmpty)
            const _HistoryEmptyCard()
          else
            ...provider.depositHistory.map(
              (item) => _HistoryItem(item, provider),
            ),
        ],
      ),
    );
  }
}

class _HistoryItem extends StatelessWidget {
  final DepositModel deposit;
  final SetorProvider provider;

  const _HistoryItem(this.deposit, this.provider);

  @override
  Widget build(BuildContext context) {
    final createdAt = deposit.createdAt;
    final dateText = createdAt == null ? '-' : _safeFormatDateTime(createdAt);
    final statusText = switch (deposit.status) {
      DepositStatus.verified => '• Tervalidasi',
      DepositStatus.rejected => '• Ditolak',
      DepositStatus.pending => '• Menunggu',
    };
    final statusBg = switch (deposit.status) {
      DepositStatus.verified => const Color(0xFFA1F085),
      DepositStatus.rejected => const Color(0xFFF5B1A8),
      DepositStatus.pending => const Color(0xFFAEF168),
    };
    final statusFg = switch (deposit.status) {
      DepositStatus.verified => const Color(0xFF0F4711),
      DepositStatus.rejected => const Color(0xFF5D1F1B),
      DepositStatus.pending => const Color(0xFF0C4D11),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF000000).withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: Color(0xFFB8E8D8),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.layers_rounded,
              color: Color(0xFF137A71),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${deposit.wasteLabel.isNotEmpty ? deposit.wasteLabel : provider.getWasteLabel(deposit.wasteType)} ${deposit.weightKg.toStringAsFixed(0)}kg',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF121B13),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  dateText,
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF6B7A6D),
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: statusBg,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              statusText,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                color: statusFg,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _safeFormatDateTime(DateTime value) {
  try {
    return DateFormat('dd MMM yyyy • HH:mm', 'id_ID').format(value);
  } catch (_) {
    return DateFormat('dd MMM yyyy • HH:mm').format(value);
  }
}

class _HistoryEmptyCard extends StatelessWidget {
  const _HistoryEmptyCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        'Belum ada data riwayat setoran',
        style: GoogleFonts.poppins(
          color: const Color(0xFF6B7A6D),
          fontSize: 13,
        ),
      ),
    );
  }
}
