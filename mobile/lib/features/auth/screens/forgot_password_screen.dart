import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() => _loading = true);
    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Forgot Password API is currently unavailable. Please contact support.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.bgGradient),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                IconButton(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.surfaceVariant,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 32),
                if (!_sent) ...[
                  // ── Form state ─────────────────────
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(
                      width: 56, height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.lock_reset_rounded, color: AppColors.primaryLight, size: 28),
                    ),
                    const SizedBox(height: 20),
                    Text('Reset Password', style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: 8),
                    Text(
                      "Enter your email and we'll send you a link to reset your password.",
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
                    ),
                    const SizedBox(height: 32),
                    Text('Email',
                        style: Theme.of(context).textTheme.bodyMedium
                            ?.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.email_outlined, color: AppColors.textMuted, size: 20),
                        hintText: 'you@example.com',
                      ),
                    ),
                    const SizedBox(height: 28),
                    _GradientBtn(
                      label: 'Send Reset Link',
                      loading: _loading,
                      onTap: _loading ? null : _send,
                    ),
                  ]).animate().fadeIn(duration: 600.ms),
                ] else ...[
                  // ── Success state ──────────────────
                  Center(
                    child: Column(
                      children: [
                        const SizedBox(height: 40),
                        Container(
                          width: 80, height: 80,
                          decoration: BoxDecoration(
                            gradient: AppColors.successGradient,
                            shape: BoxShape.circle,
                            boxShadow: [BoxShadow(color: AppColors.success.withOpacity(0.4), blurRadius: 24)],
                          ),
                          child: const Icon(Icons.mark_email_read_rounded, color: Colors.white, size: 40),
                        ),
                        const SizedBox(height: 24),
                        Text('Email Sent!', style: Theme.of(context).textTheme.headlineMedium),
                        const SizedBox(height: 12),
                        Text(
                          'Check your inbox for the reset link.\nMake sure to check your spam folder too.',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.55),
                        ),
                        const SizedBox(height: 32),
                        OutlinedButton(
                          onPressed: () => context.go('/login'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 52),
                            side: const BorderSide(color: AppColors.primary),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Back to Sign In',
                              style: TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ).animate().scale(begin: const Offset(0.8, 0.8)).fadeIn(duration: 500.ms),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GradientBtn extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback? onTap;
  const _GradientBtn({required this.label, this.loading = false, required this.onTap});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      gradient: AppColors.primaryGradient,
      borderRadius: BorderRadius.circular(12),
      boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 4))],
    ),
    child: Material(color: Colors.transparent, child: InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(height: 52, alignment: Alignment.center, child: loading
          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
          : Text(label, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white, fontSize: 15))),
    )),
  );
}
