import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/features/notification/notification_provider.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  String _selected = 'Semua';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationProvider>();
    final items = provider.byType(_selected);

    // Separate items into "Terbaru" and "Sebelumnya"
    final terbaru = items.length > 3 ? items.sublist(0, 3) : items;
    final sebelumnya = items.length > 3 ? items.sublist(3) : <NotificationItem>[];

    return Scaffold(
      backgroundColor: const Color(0xFFF2F7ED),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: const Icon(Icons.arrow_back, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Notifikasi',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            // Filter chips
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
              child: Row(
                children: [
                  _FilterChip(
                    text: 'Semua',
                    selected: _selected == 'Semua',
                    onTap: () => setState(() => _selected = 'Semua'),
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    text: 'Setoran',
                    selected: _selected == 'Setoran',
                    onTap: () => setState(() => _selected = 'Setoran'),
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    text: 'Promo',
                    selected: _selected == 'Promo',
                    onTap: () => setState(() => _selected = 'Promo'),
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: provider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(20, 6, 20, 24),
                      children: [
                        // TERBARU section
                        Text(
                          'TERBARU',
                          style: GoogleFonts.poppins(
                            letterSpacing: 2,
                            color: const Color(0xFF85907F),
                            fontWeight: FontWeight.w600,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 10),
                        if (items.isEmpty)
                          const _EmptyCard()
                        else
                          ...terbaru.map(_NotifCard.new),
                        // SEBELUMNYA section
                        if (sebelumnya.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Text(
                            'SEBELUMNYA',
                            style: GoogleFonts.poppins(
                              letterSpacing: 2,
                              color: const Color(0xFF85907F),
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 10),
                          ...sebelumnya.map(_NotifCard.new),
                        ],
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final NotificationItem item;

  const _NotifCard(this.item);

  IconData get _icon {
    switch (item.type) {
      case 'Setoran':
        return Icons.check_circle;
      case 'Promo':
        return Icons.local_offer;
      default:
        return Icons.access_time;
    }
  }

  Color get _iconColor {
    switch (item.type) {
      case 'Setoran':
        return const Color(0xFF1A7A2C);
      case 'Promo':
        return const Color(0xFF208B84);
      default:
        return const Color(0xFF1A7A2C);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _iconColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(_icon, color: _iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        item.title,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Text(
                      item.relativeTime,
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF9AA898),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  item.message,
                  style: GoogleFonts.poppins(
                    height: 1.4,
                    color: const Color(0xFF4A554B),
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

class _FilterChip extends StatelessWidget {
  final String text;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
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
            color: selected ? Colors.white : const Color(0xFF3C463E),
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EFE1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        'Belum ada notifikasi terbaru',
        style: GoogleFonts.poppins(
          color: const Color(0xFF6B7A6D),
          fontSize: 13,
        ),
      ),
    );
  }
}
