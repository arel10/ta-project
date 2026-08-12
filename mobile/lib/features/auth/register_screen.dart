import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/auth/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;

  final _formKeyStep1 = GlobalKey<FormState>();
  final _formKeyStep2 = GlobalKey<FormState>();
  final _formKeyStep3 = GlobalKey<FormState>();

  // Step 1 Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  // Step 2 Controllers
  final TextEditingController _nikController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  String _selectedGender = 'Laki-Laki';
  File? _ktpImageFile;

  // Step 3 Controllers
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  bool _agreedTerms = false;

  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _nikController.dispose();
    _addressController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _pickKtpImage() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _ktpImageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memilih gambar: $e')),
        );
      }
    }
  }

  bool _ktpError = false;

  void _nextStep() {
    if (_currentStep == 0) {
      if (!_formKeyStep1.currentState!.validate()) return;
    } else if (_currentStep == 1) {
      final formValid = _formKeyStep2.currentState!.validate();
      if (_ktpImageFile == null) {
        setState(() {
          _ktpError = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Foto KTP wajib diunggah untuk verifikasi identitas'),
            backgroundColor: Color(0xFFD32F2F),
          ),
        );
        return;
      } else {
        setState(() {
          _ktpError = false;
        });
      }
      if (!formValid) return;
    }

    if (_currentStep < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _handleRegister() async {
    if (!_formKeyStep3.currentState!.validate()) return;

    if (!_agreedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Silakan setujui syarat dan ketentuan terlebih dahulu'),
        ),
      );
      return;
    }

    final authProvider = context.read<AuthProvider>();

    try {
      final message = await authProvider.register(
        name: _nameController.text,
        email: _emailController.text,
        phone: _phoneController.text,
        password: _passwordController.text,
        nik: _nikController.text,
        gender: _selectedGender,
        address: _addressController.text,
        ktpPath: _ktpImageFile?.path,
      );

      if (!mounted) return;

      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const Icon(Icons.access_time_filled, color: Color(0xFFE6A100), size: 28),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Menunggu Verifikasi',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
              ),
            ],
          ),
          content: Text(
            message,
            style: GoogleFonts.poppins(fontSize: 14, height: 1.5),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                context.go(AppConstants.routeLogin);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A7A2C),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Ke Halaman Login'),
            ),
          ],
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'Registrasi gagal'),
        ),
      );
    }
  }

  InputDecoration _inputDecoration({
    required IconData icon,
    required String hint,
  }) {
    return InputDecoration(
      prefixIcon: Icon(icon, size: 20, color: const Color(0xFF7A8C78)),
      hintText: hint,
      hintStyle: GoogleFonts.poppins(
        color: const Color(0xFFADB8AD),
        fontSize: 14,
      ),
      filled: true,
      fillColor: const Color(0xFFF0F5EC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFD4DFC8)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFD4DFC8)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFF1A7A2C), width: 1.4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFD8EDCF), Color(0xFFE8F2E3), Color(0xFFF2F8EE)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 16),
              // Header & Logo
              Center(
                child: Column(
                  children: [
                    Image.asset(
                      'assets/images/Sirkula.png',
                      width: 50,
                      height: 50,
                      fit: BoxFit.contain,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Sirkula',
                      style: GoogleFonts.poppins(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F6A24),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Step Indicator Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Row(
                  children: [
                    _StepBadge(step: 1, title: 'Kontak', isActive: _currentStep >= 0),
                    Expanded(child: Container(height: 2, color: _currentStep >= 1 ? const Color(0xFF1A7A2C) : const Color(0xFFC9D3C4))),
                    _StepBadge(step: 2, title: 'Identitas', isActive: _currentStep >= 1),
                    Expanded(child: Container(height: 2, color: _currentStep >= 2 ? const Color(0xFF1A7A2C) : const Color(0xFFC9D3C4))),
                    _StepBadge(step: 3, title: 'Keamanan', isActive: _currentStep >= 2),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Slide View
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (index) {
                    setState(() {
                      _currentStep = index;
                    });
                  },
                  children: [
                    _buildStep1(),
                    _buildStep2(),
                    _buildStep3(authProvider),
                  ],
                ),
              ),

              // Footer Login Link
              Padding(
                padding: const EdgeInsets.only(bottom: 16, top: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Sudah punya akun? ',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF4A554B),
                        fontSize: 14,
                      ),
                    ),
                    InkWell(
                      onTap: () => context.go(AppConstants.routeLogin),
                      child: Text(
                        'Masuk',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF116924),
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // SLIDE 1: Nama Lengkap, Email, No Telp
  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 8),
      child: Form(
        key: _formKeyStep1,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Langkah 1 dari 3',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1A7A2C),
              ),
            ),
            Text(
              'Data Kontak Utama',
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1A241D),
              ),
            ),
            const SizedBox(height: 16),

            _FieldLabel('NAMA LENGKAP'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _nameController,
              style: GoogleFonts.poppins(fontSize: 14),
              decoration: _inputDecoration(
                icon: Icons.person_outline,
                hint: 'Budi Santoso',
              ),
              validator: (value) {
                if ((value ?? '').trim().isEmpty) {
                  return 'Nama lengkap wajib diisi';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),

            _FieldLabel('EMAIL'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              style: GoogleFonts.poppins(fontSize: 14),
              decoration: _inputDecoration(
                icon: Icons.mail_outline,
                hint: 'nama.anda@gmail.com',
              ),
              validator: (value) {
                final email = value?.trim() ?? '';
                final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
                if (email.isEmpty) {
                  return 'Email wajib diisi';
                }
                if (!emailRegex.hasMatch(email)) {
                  return 'Format email tidak valid';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),

            _FieldLabel('NOMOR TELEPON'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              style: GoogleFonts.poppins(fontSize: 14),
              decoration: _inputDecoration(
                icon: Icons.phone_outlined,
                hint: '08123456789',
              ),
              validator: (value) {
                final phone = value?.trim() ?? '';
                if (phone.isEmpty) {
                  return 'Nomor telepon wajib diisi';
                }
                if (!RegExp(r'^[0-9]+$').hasMatch(phone)) {
                  return 'Nomor telepon hanya boleh berupa angka';
                }
                if (phone.length < 10) {
                  return 'Nomor telepon minimal 10 digit';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _nextStep,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A7A2C),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(28),
                  ),
                  elevation: 2,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'LANJUTKAN',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward, size: 18),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // SLIDE 2: NIK, Foto KTP, Alamat Operasional, Data Personal
  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 8),
      child: Form(
        key: _formKeyStep2,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Langkah 2 dari 3',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1A7A2C),
              ),
            ),
            Text(
              'Identitas & Alamat',
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1A241D),
              ),
            ),
            const SizedBox(height: 16),

            _FieldLabel('NOMOR NIK (KTP)'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _nikController,
              keyboardType: TextInputType.number,
              style: GoogleFonts.poppins(fontSize: 14),
              maxLength: 16,
              decoration: _inputDecoration(
                icon: Icons.badge_outlined,
                hint: '16-digit NIK (contoh: 1371012345670001)',
              ).copyWith(counterText: ''),
              validator: (value) {
                final nik = value?.trim() ?? '';
                if (nik.isEmpty) {
                  return 'NIK wajib diisi';
                }
                if (nik.length != 16 || !RegExp(r'^\d{16}$').hasMatch(nik)) {
                  return 'NIK harus berupa 16 digit angka';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),

            _FieldLabel('FOTO KTP'),
            const SizedBox(height: 6),
            InkWell(
              onTap: _pickKtpImage,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _ktpError ? const Color(0xFFFDF2F2) : const Color(0xFFF0F5EC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _ktpError ? const Color(0xFFD32F2F) : const Color(0xFFD4DFC8),
                    width: _ktpError ? 1.5 : 1.0,
                  ),
                ),
                child: _ktpImageFile != null
                    ? Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(
                              _ktpImageFile!,
                              width: 60,
                              height: 45,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'KTP Terpilih',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  'Klik untuk mengganti foto',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    color: Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.red),
                            onPressed: () {
                              setState(() {
                                _ktpImageFile = null;
                              });
                            },
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: _ktpError ? const Color(0xFFFDE8E8) : const Color(0xFFD8EDCF),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              Icons.camera_alt_outlined,
                              color: _ktpError ? const Color(0xFFD32F2F) : const Color(0xFF1A7A2C),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Upload Foto KTP (Wajib)',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                    color: _ktpError ? const Color(0xFFD32F2F) : const Color(0xFF1A241D),
                                  ),
                                ),
                                Text(
                                  'Format PNG/JPG',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    color: Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            if (_ktpError) ...[
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Text(
                  'Foto KTP wajib diunggah untuk verifikasi identitas',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFFD32F2F),
                    fontSize: 12,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 14),

            _FieldLabel('JENIS KELAMIN'),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _selectedGender,
              decoration: _inputDecoration(
                icon: Icons.person_outline,
                hint: 'Pilih Jenis Kelamin',
              ),
              items: const [
                DropdownMenuItem(value: 'Laki-Laki', child: Text('Laki-Laki')),
                DropdownMenuItem(value: 'Perempuan', child: Text('Perempuan')),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _selectedGender = value;
                  });
                }
              },
            ),
            const SizedBox(height: 14),

            _FieldLabel('ALAMAT OPERASIONAL'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _addressController,
              maxLines: 2,
              style: GoogleFonts.poppins(fontSize: 14),
              decoration: _inputDecoration(
                icon: Icons.location_on_outlined,
                hint: 'Alamat lengkap tempat tinggal/operasional',
              ),
              validator: (value) {
                final addr = value?.trim() ?? '';
                if (addr.isEmpty) {
                  return 'Alamat operasional wajib diisi';
                }
                if (addr.length < 5) {
                  return 'Alamat operasional minimal 5 karakter';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _previousStep,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFF1A7A2C)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),
                    child: Text(
                      'KEMBALI',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1A7A2C),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _nextStep,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: const Color(0xFF1A7A2C),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),
                    child: Text(
                      'LANJUTKAN',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // SLIDE 3: Password & Confirm Password
  Widget _buildStep3(AuthProvider authProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 8),
      child: Form(
        key: _formKeyStep3,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Langkah 3 dari 3',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1A7A2C),
              ),
            ),
            Text(
              'Keamanan Akun',
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1A241D),
              ),
            ),
            const SizedBox(height: 16),

            _FieldLabel('KATA SANDI'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _passwordController,
              obscureText: true,
              style: GoogleFonts.poppins(fontSize: 14),
              decoration: _inputDecoration(
                icon: Icons.lock_outline,
                hint: '••••••••',
              ),
              validator: (value) {
                if ((value ?? '').isEmpty) {
                  return 'Password wajib diisi';
                }
                if ((value ?? '').length < 6) {
                  return 'Password minimal 6 karakter';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),

            _FieldLabel('KONFIRMASI KATA SANDI'),
            const SizedBox(height: 6),
            TextFormField(
              controller: _confirmPasswordController,
              obscureText: true,
              style: GoogleFonts.poppins(fontSize: 14),
              decoration: _inputDecoration(
                icon: Icons.settings_backup_restore,
                hint: '••••••••',
              ),
              validator: (value) {
                if ((value ?? '').isEmpty) {
                  return 'Konfirmasi password wajib diisi';
                }
                if (value != _passwordController.text) {
                  return 'Konfirmasi password tidak sama';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),

            // Terms checkbox
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 24,
                  height: 24,
                  child: Checkbox(
                    value: _agreedTerms,
                    onChanged: (value) {
                      setState(() {
                        _agreedTerms = value ?? false;
                      });
                    },
                    side: const BorderSide(color: Color(0xFFC9D3C4)),
                    shape: const CircleBorder(),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF49554A),
                        fontSize: 13,
                      ),
                      children: [
                        const TextSpan(text: 'Saya setuju dengan '),
                        TextSpan(
                          text: 'Syarat & Ketentuan',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF116924),
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        const TextSpan(text: ' yang berlaku.'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _previousStep,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFF1A7A2C)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),
                    child: Text(
                      'KEMBALI',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1A7A2C),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _handleRegister,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: const Color(0xFF1A7A2C),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                      elevation: 4,
                    ),
                    child: authProvider.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            'DAFTAR',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StepBadge extends StatelessWidget {
  final int step;
  final String title;
  final bool isActive;

  const _StepBadge({
    required this.step,
    required this.title,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: isActive ? const Color(0xFF1A7A2C) : const Color(0xFFC9D3C4),
          child: Text(
            '$step',
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 10,
            color: isActive ? const Color(0xFF1A7A2C) : const Color(0xFF7A8C78),
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;

  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.poppins(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: const Color(0xFF6B7A6D),
        letterSpacing: 1.2,
      ),
    );
  }
}
