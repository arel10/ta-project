import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sirkula/features/home/widgets/app_tutorial_dialog.dart';

class UserGuideScreen extends StatefulWidget {
  const UserGuideScreen({super.key});

  @override
  State<UserGuideScreen> createState() => _UserGuideScreenState();
}

class _UserGuideScreenState extends State<UserGuideScreen> {
  int _selectedCategoryIndex = 0;

  final List<_GuideCategory> _categories = const [
    _GuideCategory(
      title: 'Verifikasi Akun',
      icon: Icons.shield_outlined,
      items: [
        _GuideItem(
          question: 'Mengapa akun saya berstatus PENDING setelah registrasi?',
          answer:
              'Untuk menjaga keamanan dan keabsahan data anggota Bank Sampah, setiap akun baru wajib diverifikasi terlebih dahulu oleh Admin Dinas Lingkungan Hidup (DLH) Kota Padang.',
        ),
        _GuideItem(
          question: 'Berapa lama proses verifikasi akun?',
          answer:
              'Proses verifikasi oleh admin membutuhkan waktu sekitar 1 x 24 jam kerja. Anda akan dapat masuk ke aplikasi setelah status akun berubah menjadi Terverifikasi.',
        ),
        _GuideItem(
          question: 'Persyaratan foto KTP yang benar?',
          answer:
              'Pastikan foto KTP terlihat jelas, tidak buram, seluruh bagian KTP masuk dalam bingkai foto, dan informasi NIK serta Nama dapat terbaca dengan baik.',
        ),
      ],
    ),
    _GuideCategory(
      title: 'Setor Sampah',
      icon: Icons.recycling_outlined,
      items: [
        _GuideItem(
          question: 'Jenis sampah apa saja yang diterima?',
          answer:
              'Sirkula menerima 6 kategori sampah terpilah:\n1. Plastik (Botol, gelas mineral, kantong tebal)\n2. Kertas (Kardus, koran, HVS, buku)\n3. Logam (Kaleng alumunium, besi, seng)\n4. Kaca (Botol sirup, kecap, beling utuh)\n5. Organik (Kompos kering terolah)\n6. Elektronik (Kabel, HP bekas, komponen)',
        ),
        _GuideItem(
          question: 'Bagaimana cara melakukan penyetoran sampah?',
          answer:
              '1. Buka menu "Setor" di aplikasi Sirkula.\n2. Pilih jenis sampah yang akan disetor & masukkan estimasi berat (kg).\n3. Bawa sampah terpilah ke lokasi Bank Sampah DLH Kota Padang.\n4. Petugas akan menimbang ulang dan mengonfirmasi setoran Anda.',
        ),
        _GuideItem(
          question: 'Kapan poin setoran akan masuk ke akun saya?',
          answer:
              'Poin otomatis ditambahkan ke saldo akun Anda setelah petugas/admin memvalidasi hasil penimbangan sampah di lokasi.',
        ),
      ],
    ),
    _GuideCategory(
      title: 'Poin & Level',
      icon: Icons.stars_outlined,
      items: [
        _GuideItem(
          question: 'Bagaimana perhitungan poin setoran?',
          answer:
              'Poin dihitung berdasarkan bobot sampah (kg) dikalikan dengan rate poin per kg untuk jenis sampah tersebut. Contoh: Setor 5 kg Plastik (1.000 poin/kg) = 5.000 poin.',
        ),
        _GuideItem(
          question: 'Apa saja tingkatan level nasabah?',
          answer:
              '• Pemula / Bronze: 0 - 4.999 Poin\n• Silver: 5.000 - 9.999 Poin\n• Gold: 10.000 - 14.999 Poin\n• Platinum: ≥ 15.000 Poin\n\nSemakin tinggi level Anda, semakin banyak badge eksklusif dan kesempatan memenangkan reward spesial!',
        ),
      ],
    ),
    _GuideCategory(
      title: 'Penukaran Reward',
      icon: Icons.card_giftcard_outlined,
      items: [
        _GuideItem(
          question: 'Bagaimana cara menukarkan poin dengan reward?',
          answer:
              '1. Masuk ke tab "Reward".\n2. Pilih barang atau voucher yang Anda inginkan.\n3. Klik "Tukar Poin" dan konfirmasi.\n4. Cek tab "Riwayat" di menu Reward untuk melihat kode klaim (SRK-XXXXXX) dan status persetujuan admin.',
        ),
        _GuideItem(
          question: 'Bagaimana cara mengambil barang reward?',
          answer:
              'Setelah status klaim di tab Riwayat berubah menjadi "DISETUJUI", tunjukkan Kode Klaim ke petugas di Kantor Bank Sampah DLH Kota Padang untuk mengambil barang.',
        ),
      ],
    ),
    _GuideCategory(
      title: 'Misi & Gamifikasi',
      icon: Icons.emoji_events_outlined,
      items: [
        _GuideItem(
          question: 'Apa itu Misi Harian & Mingguan?',
          answer:
              'Misi adalah tantangan berbatas waktu (misal: "Setor 3 kg Plastik minggu ini"). Setiap kali menyelesaikan misi, Anda akan mendapatkan hadiah poin bonus instan.',
        ),
        _GuideItem(
          question: 'Bagaimana cara kerja Leaderboard?',
          answer:
              'Leaderboard menampilkan daftar nasabah paling aktif berdasarkan total poin dan kontribusi lingkungan. Peringkat dihitung secara real-time.',
        ),
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final activeCategory = _categories[_selectedCategoryIndex];

    return Scaffold(
      backgroundColor: const Color(0xFFF2F7ED),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          color: const Color(0xFF0F6E25),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Panduan Nasabah',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF1A241D),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Category horizontal selector chips
            SizedBox(
              height: 48,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final isSelected = index == _selectedCategoryIndex;
                  final cat = _categories[index];
                  return ChoiceChip(
                    showCheckmark: false,
                    avatar: Icon(
                      cat.icon,
                      size: 16,
                      color: isSelected ? Colors.white : const Color(0xFF1A7A2C),
                    ),
                    label: Text(
                      cat.title,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : const Color(0xFF1A241D),
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: const Color(0xFF1A7A2C),
                    backgroundColor: const Color(0xFFE8EFE1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide.none,
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedCategoryIndex = index;
                        });
                      }
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 14),

            // Accordion Items List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  Text(
                    activeCategory.title,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1A7A2C),
                    ),
                  ),
                  const SizedBox(height: 10),
                  ...activeCategory.items.map((item) => _GuideExpansionCard(item: item)),
                  const SizedBox(height: 20),

                  // Re-run tutorial button card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F4E5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFC8E0C4)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(
                            color: Color(0xFF1A7A2C),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.play_arrow_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ingin melihat tutorial pop-up?',
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                  color: const Color(0xFF1A241D),
                                ),
                              ),
                              Text(
                                'Ulangi slide pengenalan aplikasi kapan saja.',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: const Color(0xFF5F6E60),
                                ),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            AppTutorialDialog.forceShow(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1A7A2C),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            elevation: 0,
                          ),
                          child: Text(
                            'Mulai',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuideExpansionCard extends StatelessWidget {
  final _GuideItem item;

  const _GuideExpansionCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          title: Text(
            item.question,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: const Color(0xFF1A241D),
            ),
          ),
          children: [
            Text(
              item.answer,
              style: GoogleFonts.poppins(
                fontSize: 12,
                height: 1.5,
                color: const Color(0xFF5F6E60),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuideCategory {
  final String title;
  final IconData icon;
  final List<_GuideItem> items;

  const _GuideCategory({
    required this.title,
    required this.icon,
    required this.items,
  });
}

class _GuideItem {
  final String question;
  final String answer;

  const _GuideItem({
    required this.question,
    required this.answer,
  });
}
