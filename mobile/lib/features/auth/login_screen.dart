import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:sirkula/core/constants.dart';
import 'package:sirkula/features/auth/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  /// Validates and submits login form.
  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final authProvider = context.read<AuthProvider>();
    try {
      await authProvider.login(_emailController.text, _passwordController.text);
      if (!mounted) {
        return;
      }
      context.go(AppConstants.routeHome);
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'Terjadi kesalahan'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      body: Stack(
        children: [
          // Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFD8EDCF),
                  Color(0xFFE8F2E3),
                  Color(0xFFF2F8EE),
                ],
              ),
            ),
          ),
          // Top-left green blob
          Positioned(
            top: -100,
            left: -60,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF90C29A).withValues(alpha: 0.35),
                    const Color(0xFFF2F8EE).withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          // Bottom curve
          Positioned(
            bottom: -40,
            left: -40,
            right: -40,
            child: Container(
              height: 120,
              decoration: const BoxDecoration(
                color: Color(0xFFE0EBD8),
                borderRadius: BorderRadius.vertical(
                  top: Radius.elliptical(500, 80),
                ),
              ),
            ),
          ),
          SafeArea(
            child: SizedBox.expand(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 24,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 40),
                    // Logo + Branding
                    Center(
                      child: Column(
                        children: [
                          Image.asset(
                            'assets/images/Sirkula.png',
                            width: 80,
                            height: 80,
                            fit: BoxFit.contain,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Sirkula',
                            style: GoogleFonts.poppins(
                              fontSize: 32,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F6A24),
                            ),
                          ),
                          Text(
                            'E K O S I S T E M   D A U R   U L A N G',
                            style: GoogleFonts.poppins(
                              letterSpacing: 2,
                              fontSize: 10,
                              color: const Color(0xFF35703A),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 48),
                    // Welcome text
                    Center(
                      child: Text(
                        'Selamat Datang',
                        style: GoogleFonts.poppins(
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1A241D),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Center(
                      child: Text(
                        'Masuk untuk menyetor sampah dan tukar poin',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: const Color(0xFF6B7A6D),
                        ),
                      ),
                    ),
                    const SizedBox(height: 36),
                    Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'ALAMAT EMAIL',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF6B7A6D),
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            style: GoogleFonts.poppins(fontSize: 14),
                            decoration: InputDecoration(
                              prefixIcon: const Icon(
                                Icons.mail_outline,
                                size: 20,
                              ),
                              hintText: 'nama.anda@gmail.com',
                              hintStyle: GoogleFonts.poppins(
                                color: const Color(0xFFADB8AD),
                                fontSize: 14,
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF0F5EC),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(
                                  color: Color(0xFFD4DFC8),
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(
                                  color: Color(0xFFD4DFC8),
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(
                                  color: Color(0xFF1A7A2C),
                                  width: 1.4,
                                ),
                              ),
                            ),
                            validator: (value) {
                              final email = value?.trim() ?? '';
                              final emailRegex = RegExp(
                                r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                              );
                              if (email.isEmpty) {
                                return 'Email wajib diisi';
                              }
                              if (!emailRegex.hasMatch(email)) {
                                return 'Format email tidak valid';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 18),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'KATA SANDI',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF6B7A6D),
                                  letterSpacing: 1.2,
                                ),
                              ),
                              Text(
                                'LUPA SANDI?',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: const Color(0xFF0F6A24),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            style: GoogleFonts.poppins(fontSize: 14),
                            decoration: InputDecoration(
                              prefixIcon: const Icon(
                                Icons.lock_outline,
                                size: 20,
                              ),
                              hintText: '••••••••',
                              hintStyle: GoogleFonts.poppins(
                                color: const Color(0xFFADB8AD),
                                fontSize: 14,
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF0F5EC),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(
                                  color: Color(0xFFD4DFC8),
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(
                                  color: Color(0xFFD4DFC8),
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: const BorderSide(
                                  color: Color(0xFF1A7A2C),
                                  width: 1.4,
                                ),
                              ),
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
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Login Button
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: authProvider.isLoading ? null : _handleLogin,
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
                            : Text(
                                'MASUK',
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                  letterSpacing: 2,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    const Divider(color: Color(0xFFD0DACA), thickness: 1),
                    const SizedBox(height: 24),
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            "Belum punya akun? ",
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF4A554B),
                              fontSize: 14,
                            ),
                          ),
                          InkWell(
                            onTap: () => context.go(AppConstants.routeRegister),
                            child: Text(
                              'Daftar',
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
                          Icon(
                            Icons.recycling,
                            color: Color(0xFFAAB8A8),
                            size: 18,
                          ),
                          SizedBox(width: 8),
                          Icon(
                            Icons.eco_outlined,
                            color: Color(0xFFAAB8A8),
                            size: 18,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
