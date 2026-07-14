import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/exceptions.dart';
import 'package:sirkula/features/auth/auth_provider.dart';
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
  double _completeness = 0.0;

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

    // Listen to changes to update completeness in real-time
    _nameController.addListener(_updateCompleteness);
    _emailController.addListener(_updateCompleteness);
    _accountNumberController.addListener(_updateCompleteness);
    _nikController.addListener(_updateCompleteness);
    _addressController.addListener(_updateCompleteness);
    _departmentController.addListener(_updateCompleteness);

    _updateCompleteness();
  }

  void _updateCompleteness() {
    int total = 7;
    int filled = 0;
    if (_nameController.text.trim().isNotEmpty) filled++;
    if (_emailController.text.trim().isNotEmpty) filled++;
    if (_accountNumberController.text.trim().isNotEmpty) filled++;
    if (_gender.isNotEmpty) filled++;
    if (_nikController.text.trim().isNotEmpty) filled++;
    if (_departmentController.text.trim().isNotEmpty) filled++;
    if (_addressController.text.trim().isNotEmpty) filled++;

    setState(() {
      _completeness = filled / total;
    });
  }

  @override
  void dispose() {
    _nameController.removeListener(_updateCompleteness);
    _emailController.removeListener(_updateCompleteness);
    _accountNumberController.removeListener(_updateCompleteness);
    _nikController.removeListener(_updateCompleteness);
    _addressController.removeListener(_updateCompleteness);
    _departmentController.removeListener(_updateCompleteness);

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
    final authProvider = context.read<AuthProvider>();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      await provider.updateProfile(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        accountNumber: _accountNumberController.text.trim(),
        gender: _gender,
        nik: _nikController.text.trim(),
        address: _addressController.text.trim(),
        department: _departmentController.text.trim(),
      );

      if (!mounted) {
        return;
      }

      await authProvider.checkAuth();

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
              const SizedBox(width: 12),
              Text(
                'Profil Anda berhasil disimpan!',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 13),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF0F6E25),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          margin: const EdgeInsets.all(16),
          elevation: 6,
        ),
      );
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.white, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  e.message,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 13),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFFD32F2F),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          margin: const EdgeInsets.all(16),
          elevation: 6,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSaving = context.watch<ProfilProvider>().isSaving;
    final user = widget.initialUser;
    final userInitials = user != null && user.name.isNotEmpty
        ? user.name.trim().split(' ').map((e) => e[0]).take(2).join().toUpperCase()
        : 'U';

    final completenessPercentage = (_completeness * 100).toInt();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FBF8),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16, top: 8, bottom: 8),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE5EDE4), width: 1.2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 13),
              color: const Color(0xFF0F6E25),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ),
        title: Text(
          'Edit Profil',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w800,
            fontSize: 17,
            color: const Color(0xFF143A1F),
            letterSpacing: -0.5,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
            children: [
              // Premium Clean Profile Avatar Section (High aesthetic details)
              Center(
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 106,
                          height: 106,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF0F6E25).withOpacity(0.15), width: 1.5),
                          ),
                          alignment: Alignment.center,
                          child: Container(
                            width: 92,
                            height: 92,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF0F6E25).withOpacity(0.08),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(4.0),
                              child: Container(
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: LinearGradient(
                                    colors: [Color(0xFFE2EFE0), Color(0xFFC7E2C2)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    userInitials,
                                    style: GoogleFonts.poppins(
                                      fontSize: 30,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF0F6E25),
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 2,
                          right: 2,
                          child: Container(
                            height: 32,
                            width: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F6E25),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2.5),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF0F6E25).withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.camera_alt_rounded,
                              size: 13,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      user?.name ?? 'Pengguna Sirkula',
                      style: GoogleFonts.poppins(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF143A1F),
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF2E4),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(color: const Color(0xFFD4E6CE), width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.stars_rounded, size: 12, color: Color(0xFF0F6E25)),
                          const SizedBox(width: 4),
                          Text(
                            user?.accountNumber.isNotEmpty == true
                                ? user!.accountNumber
                                : 'Belum Ada No. Rekening',
                            style: GoogleFonts.poppins(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F6E25),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Real-time Completeness Bar (Premium styled card)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFEBF1EB), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F6E25).withOpacity(0.02),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.shield_outlined, size: 16, color: Color(0xFF0F6E25)),
                            const SizedBox(width: 6),
                            Text(
                              'Kelengkapan Profil',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: const Color(0xFF0C4D1D),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '$completenessPercentage%',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                            color: const Color(0xFF0F6E25),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: _completeness,
                        minHeight: 7,
                        backgroundColor: const Color(0xFFE5EDE4),
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0F6E25)),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      completenessPercentage == 100
                          ? '🎉 Keren! Profil Anda sudah lengkap & terverifikasi.'
                          : 'Lengkapi profil Anda agar transaksi penukaran diproses lebih cepat.',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: const Color(0xFF6B7A6D),
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 36),

              // Section: Data Utama
              _buildSectionHeader('INFORMASI AKUN', Icons.account_circle_outlined),
              _buildTextField(
                controller: _nameController,
                label: 'Nama Lengkap',
                icon: Icons.person_outline_rounded,
                requiredField: true,
                isSaving: isSaving,
              ),
              const SizedBox(height: 20),
              _buildTextField(
                controller: _emailController,
                label: 'Alamat Email',
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
              const SizedBox(height: 20),
              _buildTextField(
                controller: _accountNumberController,
                label: 'Nomor Rekening Bank',
                icon: Icons.payment_rounded,
                helper: 'Format: SRK-XXXXXX',
                isSaving: isSaving,
              ),
              const SizedBox(height: 36),

              // Section: Identitas Tambahan
              _buildSectionHeader('DATA PERSONAL', Icons.badge_outlined),
              _buildGenderSelector(isSaving),
              const SizedBox(height: 20),
              _buildTextField(
                controller: _nikController,
                label: 'Nomor Induk Kependudukan (NIK)',
                icon: Icons.credit_card_rounded,
                keyboardType: TextInputType.number,
                isSaving: isSaving,
                validator: (value) {
                  final raw = (value ?? '').trim();
                  if (raw.isNotEmpty && raw.length != 16) {
                    return 'NIK harus terdiri dari 16 digit';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              _buildTextField(
                controller: _departmentController,
                label: 'Departemen / Unit Kerja',
                icon: Icons.work_outline_rounded,
                isSaving: isSaving,
              ),
              const SizedBox(height: 36),

              // Section: Alamat
              _buildSectionHeader('ALAMAT OPERASIONAL', Icons.map_outlined),
              _buildTextField(
                controller: _addressController,
                label: 'Alamat Lengkap Rumah',
                icon: Icons.location_on_outlined,
                maxLines: 3,
                isSaving: isSaving,
              ),
              const SizedBox(height: 44),

              // Submit Button
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F6E25).withOpacity(0.24),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: FilledButton(
                  onPressed: isSaving ? null : _submit,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(58),
                    backgroundColor: const Color(0xFF0F6E25),
                    disabledBackgroundColor: const Color(0xFF90C29E),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    elevation: 0,
                  ),
                  child: isSaving
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.check_circle_outline_rounded, size: 20),
                            const SizedBox(width: 10),
                            Text(
                              'Simpan Perubahan',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: const Color(0xFF0F6E25),
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0C4D1D),
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Divider(color: Color(0xFFE5EDE4), thickness: 1.2),
        const SizedBox(height: 18),
      ],
    );
  }

  Widget _buildGenderSelector(bool isSaving) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Jenis Kelamin',
          style: GoogleFonts.poppins(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF6B7A6D),
            letterSpacing: 0.2,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _GenderOptionCard(
                label: 'Laki-laki',
                icon: Icons.male_rounded,
                isSelected: _gender == 'Laki-laki',
                color: const Color(0xFF0F6E25),
                isEnabled: !isSaving,
                onTap: () {
                  setState(() {
                    _gender = 'Laki-laki';
                  });
                  _updateCompleteness();
                },
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _GenderOptionCard(
                label: 'Perempuan',
                icon: Icons.female_rounded,
                isSelected: _gender == 'Perempuan',
                color: const Color(0xFFE05C84),
                isEnabled: !isSaving,
                onTap: () {
                  setState(() {
                    _gender = 'Perempuan';
                  });
                  _updateCompleteness();
                },
              ),
            ),
          ],
        ),
      ],
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
    final isValid = controller.text.trim().isNotEmpty && (validator == null || validator(controller.text) == null);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF6B7A6D),
            letterSpacing: 0.2,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          enabled: !isSaving,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: const Color(0xFF143A1F),
            fontWeight: FontWeight.w600,
          ),
          decoration: InputDecoration(
            hintText: 'Masukkan ${label.toLowerCase()}',
            hintStyle: GoogleFonts.poppins(
              color: const Color(0xFFB0C0B2),
              fontSize: 13,
            ),
            helperText: helper,
            helperStyle: GoogleFonts.poppins(
              fontSize: 11,
              color: const Color(0xFF8B9B8E),
              fontWeight: FontWeight.w500,
            ),
            prefixIcon: Icon(icon, size: 18, color: const Color(0xFF8B9B8E)),
            suffixIcon: isValid 
                ? const Icon(Icons.check_circle_rounded, color: Color(0xFF0F6E25), size: 18)
                : null,
            filled: true,
            fillColor: const Color(0xFFF4F7F3),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFF0F6E25), width: 1.6),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFC62828), width: 1.2),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFC62828), width: 1.6),
            ),
            errorStyle: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: const Color(0xFFC62828),
            ),
          ),
          validator: validator ??
              (requiredField
                  ? (value) {
                      if ((value ?? '').trim().isEmpty) {
                        return '$label wajib diisi';
                      }
                      return null;
                    }
                  : null),
        ),
      ],
    );
  }
}

class _GenderOptionCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final Color color;
  final bool isEnabled;
  final VoidCallback onTap;

  const _GenderOptionCard({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.color,
    required this.isEnabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = isSelected ? color : const Color(0xFF6B7A6D);
    return InkWell(
      onTap: isEnabled ? onTap : null,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.08) : const Color(0xFFF3F7F2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : Colors.transparent,
            width: isSelected ? 1.8 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: color.withOpacity(0.08),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: activeColor,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: activeColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
