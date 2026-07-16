import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/auth/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _agreedTerms = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  /// Validates and submits registration form.
  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

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
      await authProvider.register(
        name: _nameController.text,
        email: _emailController.text,
        phone: _phoneController.text,
        password: _passwordController.text,
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Registrasi berhasil. Silakan masuk ke akun Anda.'),
        ),
      );
      context.go(AppConstants.routeLogin);
    } catch (_) {
      if (!mounted) {
        return;
      }
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 30),
                  // Logo + Branding
                  Center(
                    child: Column(
                      children: [
                        Image.asset(
                          'assets/images/Sirkula.png',
                          width: 70,
                          height: 70,
                          fit: BoxFit.contain,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Sirkula',
                          style: GoogleFonts.poppins(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F6A24),
                          ),
                        ),
                        Text(
                          'E K O S I S T E M   D A U R   U L A N G',
                          style: GoogleFonts.poppins(
                            letterSpacing: 2,
                            fontSize: 9,
                            color: const Color(0xFF35703A),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Title
                  Text(
                    'Daftar Akun Baru',
                    style: GoogleFonts.poppins(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1A241D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Bergabunglah dalam ekosistem hijau kami',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: const Color(0xFF6B7A6D),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Fields
                  _FieldLabel('NAMA LENGKAP'),
                  const SizedBox(height: 8),
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
                  const SizedBox(height: 8),
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
                  const SizedBox(height: 8),
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
                      if (phone.length < 10) {
                        return 'Nomor telepon minimal 10 digit';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),
                  _FieldLabel('KATA SANDI'),
                  const SizedBox(height: 8),
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
                  const SizedBox(height: 8),
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
                  const SizedBox(height: 12),
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
                              const TextSpan(
                                  text: ' yang berlaku di platform ini.'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Register Button
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed:
                          authProvider.isLoading ? null : _handleRegister,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A7A2C),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                        elevation: 4,
                      ),
                      child: authProvider.isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.2,
                                color: Colors.white,
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'DAFTAR SEKARANG',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(Icons.arrow_forward, size: 20),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Divider(color: Color(0xFFD0DACA), thickness: 1),
                  const SizedBox(height: 20),
                  Center(
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
                  const SizedBox(height: 16),
                  Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.spa, color: Color(0xFFAAB8A8), size: 18),
                        SizedBox(width: 8),
                        Icon(Icons.recycling, color: Color(0xFFAAB8A8), size: 18),
                        SizedBox(width: 8),
                        Icon(Icons.eco_outlined, color: Color(0xFFAAB8A8), size: 18),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
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
