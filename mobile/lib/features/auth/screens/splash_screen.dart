import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/auth/auth_controller.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (AuthController.instance.isLoggedIn) {
        context.go('/dashboard');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.bgGradient),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              children: [
                const Spacer(flex: 2),

                // ── Logo ──────────────────────────────
                _LogoSection()
                    .animate()
                    .fadeIn(duration: 800.ms)
                    .scale(begin: const Offset(0.8, 0.8), duration: 800.ms, curve: Curves.easeOut),

                const Spacer(flex: 2),

                // ── Tagline ───────────────────────────
                Column(
                  children: [
                    Text(
                      'Your AI-powered\ncareer roadmap',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: AppColors.textPrimary,
                            height: 1.25,
                          ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Get a personalized learning path, daily tasks,\nand quizzes tailored to your career goals.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.55),
                    ),
                  ],
                ).animate().fadeIn(duration: 800.ms, delay: 200.ms).slideY(begin: 0.2, end: 0),

                const Spacer(flex: 3),

                // ── Feature pills ─────────────────────
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.center,
                  children: const [
                    _FeaturePill(icon: Icons.auto_awesome_rounded, label: 'AI Roadmaps'),
                    _FeaturePill(icon: Icons.task_alt_rounded, label: 'Daily Tasks'),
                    _FeaturePill(icon: Icons.quiz_rounded, label: 'Phase Quizzes'),
                    _FeaturePill(icon: Icons.local_fire_department_rounded, label: 'Streaks'),
                  ],
                ).animate().fadeIn(delay: 400.ms),

                const Spacer(flex: 2),

                // ── CTAs ──────────────────────────────
                Column(
                  children: [
                    _GradientButton(
                      label: 'Get Started',
                      onTap: () => context.go('/register'),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: () => context.go('/login'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 52),
                        side: const BorderSide(color: AppColors.borderLight),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'I already have an account',
                        style: Theme.of(context)
                            .textTheme
                            .labelLarge
                            ?.copyWith(color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.3, end: 0),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Logo Section ─────────────────────────────────────
class _LogoSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.4),
                blurRadius: 32,
                spreadRadius: 4,
              ),
            ],
          ),
          child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 48),
        ),
        const SizedBox(height: 20),
        ShaderMask(
          shaderCallback: (bounds) => AppColors.primaryGradient.createShader(bounds),
          child: Text(
            'CareerPilot',
            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  color: Colors.white,
                  letterSpacing: -1,
                ),
          ),
        ),
      ],
    );
  }
}

// ── Feature Pill ─────────────────────────────────────
class _FeaturePill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _FeaturePill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.primaryLight),
          const SizedBox(width: 6),
          Text(label,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

// ── Gradient Button ───────────────────────────────────
class _GradientButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _GradientButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
              color: AppColors.primary.withOpacity(0.35), blurRadius: 16, offset: const Offset(0, 4))
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Container(
            height: 52,
            alignment: Alignment.center,
            child: Text(label,
                style: Theme.of(context)
                    .textTheme
                    .labelLarge
                    ?.copyWith(color: Colors.white, fontSize: 15)),
          ),
        ),
      ),
    );
  }
}

