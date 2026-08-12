import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/profil/profil_provider.dart';

class SupportCenterScreen extends StatefulWidget {
  const SupportCenterScreen({super.key});

  @override
  State<SupportCenterScreen> createState() => _SupportCenterScreenState();
}

class _SupportCenterScreenState extends State<SupportCenterScreen> {
  final TextEditingController _searchController = TextEditingController();

  final List<String> _faqs = const [
    'Bagaimana cara menukar poin?',
    'Jenis sampah apa yang diterima?',
    'Mengapa setoran saya ditolak?',
    'Lupa kata sandi akun Sirkula?',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProfilProvider>().fetchProfile();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<ProfilProvider>().userModel;

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
                  'Pusat Bantuan',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0F6E25),
                    fontStyle: FontStyle.italic,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Color(0xFFE8EFE1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.notifications_none_rounded,
                    color: Color(0xFF0F6E25),
                    size: 20,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Hero text
            Text(
              'Ada yang bisa kami\nbantu?',
              style: GoogleFonts.poppins(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF0D6A24),
                height: 1.1,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Cari solusi atau pilih kategori di bawah ini.',
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: const Color(0xFF6B7A6D),
              ),
            ),
            const SizedBox(height: 14),
            // Search
            TextField(
              controller: _searchController,
              style: GoogleFonts.poppins(fontSize: 13),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search, size: 20),
                hintText: "Cari FAQ, contoh: 'Cara setor sampah'",
                hintStyle: GoogleFonts.poppins(
                  color: const Color(0xFF9AA898),
                  fontSize: 13,
                ),
                filled: true,
                fillColor: const Color(0xFFF0F5EC),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: const BorderSide(color: Color(0xFFD4DFC8)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: const BorderSide(color: Color(0xFFD4DFC8)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: const BorderSide(
                    color: Color(0xFF1A7A2C),
                    width: 1.4,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            // Panduan Banner Card
            InkWell(
              onTap: () => context.push(AppConstants.routeUserGuide),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F6E25), Color(0xFF268D3E)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x1A0F6E25),
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: Colors.white24,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.menu_book_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Panduan Lengkap Nasabah',
                            style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Buka petunjuk setor, poin, level & reward',
                            style: GoogleFonts.poppins(
                              color: const Color(0xFFD8E8D5),
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: Colors.white,
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Category Cards
            Row(
              children: [
                Expanded(
                  child: _CategoryCard(
                    icon: Icons.person_outline,
                    title: 'Akun',
                    onTap: () => context.push(AppConstants.routeUserGuide),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _CategoryCard(
                    icon: Icons.assignment_outlined,
                    title: 'Setoran',
                    onTap: () => context.push(AppConstants.routeUserGuide),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _CategoryCard(
                    icon: Icons.card_giftcard,
                    title: 'Reward',
                    onTap: () => context.push(AppConstants.routeUserGuide),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _CategoryCard(
                    icon: Icons.shield_outlined,
                    title: 'Keamanan',
                    onTap: () => context.push(AppConstants.routeUserGuide),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // FAQ Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'FAQ Populer',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  'Lihat Semua',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF0F6E25),
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ..._faqs.map((item) => _FaqTile(text: item)),
            const SizedBox(height: 16),
            // Support Card
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
                    'Masih Butuh Bantuan?',
                    style: GoogleFonts.poppins(
                      fontSize: 22,
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Tim support kami siap membantu Anda 24/7 melalui jalur komunikasi resmi.',
                    style: GoogleFonts.poppins(
                      color: const Color(0xFFD8E8D5),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // WhatsApp button
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE7F1DE),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.chat_outlined,
                          color: Color(0xFF15742B),
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'WhatsApp Support',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF15742B),
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Email button
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.4),
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.email_outlined,
                          color: Colors.white,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Hubungi via Email',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ],
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

class _CategoryCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onTap;

  const _CategoryCard({required this.icon, required this.title, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: const Color(0xFFE8EFE1),
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: Color(0xFFD0DEC9),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: const Color(0xFF0F6E25), size: 18),
            ),
            const Spacer(),
            Text(
              title,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FaqTile extends StatelessWidget {
  final String text;

  const _FaqTile({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F3),
        borderRadius: BorderRadius.circular(18),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        title: Text(
          text,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        trailing: const Icon(Icons.keyboard_arrow_down, size: 22),
      ),
    );
  }
}
