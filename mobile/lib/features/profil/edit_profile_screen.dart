import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/features/profil/profil_provider.dart';
import 'package:sirkula/models/user_model.dart';

class EditProfileScreen extends StatefulWidget {
  final UserModel? initialUser;

  const EditProfileScreen({super.key, this.initialUser});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _accountNumberController;
  late final TextEditingController _nikController;
  late final TextEditingController _addressController;
  late final TextEditingController _departmentController;

  String _gender = '';

  @override
  void initState() {
    super.initState();
    final user = widget.initialUser;
    _nameController = TextEditingController(text: user?.name ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _accountNumberController = TextEditingController(
      text: user?.accountNumber ?? '',
    );
    _nikController = TextEditingController(text: user?.nik ?? '');
    _addressController = TextEditingController(text: user?.address ?? '');
    _departmentController = TextEditingController(text: user?.department ?? '');
    _gender = _normalizeGender(user?.gender);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _accountNumberController.dispose();
    _nikController.dispose();
    _addressController.dispose();
    _departmentController.dispose();
    super.dispose();
  }

  String _normalizeGender(String? value) {
    final raw = (value ?? '').trim().toLowerCase();
    if (raw == 'laki-laki' || raw == 'laki laki' || raw == 'l') {
      return 'Laki-laki';
    }
    if (raw == 'perempuan' || raw == 'p') {
      return 'Perempuan';
    }
    return '';
  }

  Future<void> _submit() async {
    final provider = context.read<ProfilProvider>();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      await provider.updateProfile(
        name: _nameController.text,
        email: _emailController.text,
        accountNumber: _accountNumberController.text,
        gender: _gender,
        nik: _nikController.text,
        address: _addressController.text,
        department: _departmentController.text,
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profil berhasil diperbarui')),
      );
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSaving = context.watch<ProfilProvider>().isSaving;
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F7EE),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        title: Text(
          'Lengkapi Profil',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w700,
            color: const Color(0xFF143A1F),
          ),
        ),
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0D6F25), Color(0xFF3BA84F)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.22),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.edit_note_rounded,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Lengkapi data akunmu',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Data yang lengkap bantu proses verifikasi dan layanan jadi lebih cepat.',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.88),
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              _SectionCard(
                title: 'Data Utama',
                subtitle: 'Informasi yang wajib untuk identitas akun',
                children: [
                  _buildTextField(
                    controller: _nameController,
                    label: 'Nama Lengkap',
                    icon: Icons.person_outline_rounded,
                    requiredField: true,
                    isSaving: isSaving,
                  ),
                  const SizedBox(height: 12),
                  _buildTextField(
                    controller: _emailController,
                    label: 'Email',
                    icon: Icons.alternate_email_rounded,
                    keyboardType: TextInputType.emailAddress,
                    requiredField: true,
                    isSaving: isSaving,
                    validator: (value) {
                      final raw = (value ?? '').trim();
                      if (raw.isEmpty) {
                        return 'Email wajib diisi';
                      }
                      if (!raw.contains('@')) {
                        return 'Format email tidak valid';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  _buildTextField(
                    controller: _accountNumberController,
                    label: 'Nomor Akun',
                    icon: Icons.badge_outlined,
                    helper: 'Contoh: SRK-123456',
                    isSaving: isSaving,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _SectionCard(
                title: 'Identitas Tambahan',
                subtitle: 'Membantu proses validasi dan pelaporan internal',
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: _gender.isEmpty ? null : _gender,
                    items: const [
                      DropdownMenuItem(
                        value: 'Laki-laki',
                        child: Text('Laki-laki'),
                      ),
                      DropdownMenuItem(
                        value: 'Perempuan',
                        child: Text('Perempuan'),
                      ),
                    ],
                    decoration: InputDecoration(
                      labelText: 'Jenis Kelamin',
                      hintText: 'Pilih jenis kelamin',
                      prefixIcon: const Icon(Icons.wc_rounded),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(
                          color: theme.colorScheme.outline.withValues(
                            alpha: 0.35,
                          ),
                        ),
                      ),
                    ),
                    onChanged: isSaving
                        ? null
                        : (value) {
                            setState(() {
                              _gender = value ?? '';
                            });
                          },
                  ),
                  const SizedBox(height: 12),
                  _buildTextField(
                    controller: _nikController,
                    label: 'NIK',
                    icon: Icons.credit_card_rounded,
                    keyboardType: TextInputType.number,
                    isSaving: isSaving,
                  ),
                  const SizedBox(height: 12),
                  _buildTextField(
                    controller: _departmentController,
                    label: 'Departemen/Unit',
                    icon: Icons.business_outlined,
                    isSaving: isSaving,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _SectionCard(
                title: 'Kontak Lokasi',
                subtitle: 'Alamat akan digunakan untuk kebutuhan operasional',
                children: [
                  _buildTextField(
                    controller: _addressController,
                    label: 'Alamat',
                    icon: Icons.location_on_outlined,
                    maxLines: 3,
                    isSaving: isSaving,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0D6F25).withValues(alpha: 0.22),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: FilledButton.icon(
                  onPressed: isSaving ? null : _submit,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(54),
                    backgroundColor: const Color(0xFF0D6F25),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  icon: isSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.check_circle_outline_rounded),
                  label: Text(
                    isSaving ? 'Menyimpan...' : 'Simpan Profil',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required bool isSaving,
    bool requiredField = false,
    int maxLines = 1,
    String? helper,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      enabled: !isSaving,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        helperText: helper,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
      ),
      validator:
          validator ??
          (requiredField
              ? (value) {
                  if ((value ?? '').trim().isEmpty) {
                    return '$label wajib diisi';
                  }
                  return null;
                }
              : null),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Widget> children;

  const _SectionCard({
    required this.title,
    required this.subtitle,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF2E4),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1B3A22),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: const Color(0xFF58705B),
            ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}
