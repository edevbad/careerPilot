import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/models/quiz_session_model.dart';

class QuizResultsScreen extends StatelessWidget {
  final QuizResultModel result;
  const QuizResultsScreen({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final passed = result.passed;
    final score = result.score;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
            const SizedBox(height: 32),

            // ── Score circle ──────────────────────
            _ScoreRing(score: score, passed: passed)
                .animate()
                .scale(
                    begin: const Offset(0.5, 0.5),
                    duration: 700.ms,
                    curve: Curves.elasticOut),

            const SizedBox(height: 24),

            // ── Title & badge ─────────────────────
            Text(
              passed ? '🎉 Phase Passed!' : 'Keep Practicing!',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: passed ? AppColors.success : AppColors.error),
              textAlign: TextAlign.center,
            ).animate().fadeIn(delay: 300.ms),

            const SizedBox(height: 8),

            Text(
              passed
                  ? 'Excellent work! You scored $score% and '
                      '${result.nextPhaseUnlocked ? 'unlocked the next phase.' : 'kept your progress.'}'
                  : 'You scored $score%. You need ${result.passingScore}% to pass. Keep studying!',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.55),
            ).animate().fadeIn(delay: 400.ms),

            if (passed && result.nextPhaseUnlocked) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  gradient: AppColors.successGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.lock_open_rounded, color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Text('Next Phase Unlocked! 🚀',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14)),
                ]),
              ).animate().fadeIn(delay: 500.ms).shake(delay: 700.ms),
            ],

            if (!passed) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.schedule_rounded, color: AppColors.warning, size: 16),
                  const SizedBox(width: 8),
                  Text('Retake available in 24 hours',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.warning, fontWeight: FontWeight.w600)),
                ]),
              ).animate().fadeIn(delay: 500.ms),
            ],

            const SizedBox(height: 24),

            // ── Stats row ─────────────────────────
            _StatsRow(result: result).animate().fadeIn(delay: 600.ms),

            const SizedBox(height: 24),

            // ── Study suggestions (fail only) ──────
            if (!passed && result.studySuggestions.isNotEmpty) ...[
              _StudySuggestions(suggestions: result.studySuggestions)
                  .animate()
                  .fadeIn(delay: 700.ms),
              const SizedBox(height: 24),
            ],

            // ── CTAs ──────────────────────────────
            Column(children: [
              if (passed)
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4))
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => context.go('/roadmap'),
                      child: Container(
                        height: 52,
                        alignment: Alignment.center,
                        child: const Text('Continue to Next Phase',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 15)),
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.go('/dashboard'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    side: const BorderSide(color: AppColors.border),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    minimumSize: const Size(0, 50),
                  ),
                  child: const Text('Back to Dashboard'),
                ),
              ),
            ]).animate().fadeIn(delay: 800.ms),

            const SizedBox(height: 32),
          ]),
        ),
      ),
    );
  }
}

// ── Score ring ────────────────────────────────────────
class _ScoreRing extends StatelessWidget {
  final int score;
  final bool passed;
  const _ScoreRing({required this.score, required this.passed});

  @override
  Widget build(BuildContext context) {
    final color = passed ? AppColors.success : AppColors.error;
    return SizedBox(
      width: 140,
      height: 140,
      child: Stack(alignment: Alignment.center, children: [
        SizedBox(
          width: 140,
          height: 140,
          child: CircularProgressIndicator(
            value: score / 100,
            backgroundColor: AppColors.surfaceVariant,
            valueColor: AlwaysStoppedAnimation(color),
            strokeWidth: 10,
            strokeCap: StrokeCap.round,
          ),
        ),
        Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text('$score%',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: color, fontWeight: FontWeight.w800, fontSize: 32)),
          Text(passed ? 'Passed ✓' : 'Failed ✗',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: color, fontWeight: FontWeight.w600)),
        ]),
      ]),
    );
  }
}

// ── Stats row ─────────────────────────────────────────
class _StatsRow extends StatelessWidget {
  final QuizResultModel result;
  const _StatsRow({required this.result});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
        _Stat('${result.correctAnswers}', 'Correct', AppColors.success),
        _Vdiv(),
        _Stat('${result.totalQuestions - result.correctAnswers}', 'Wrong', AppColors.error),
        _Vdiv(),
        _Stat(
            result.durationFormatted.isNotEmpty ? result.durationFormatted : '—',
            'Time',
            AppColors.primary),
        _Vdiv(),
        _Stat('${result.totalQuestions}', 'Total', AppColors.textSecondary),
      ]),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value, label;
  final Color color;
  const _Stat(this.value, this.label, this.color);

  @override
  Widget build(BuildContext context) => Column(children: [
        Text(value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: color, fontWeight: FontWeight.w800)),
        const SizedBox(height: 2),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ]);
}

class _Vdiv extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 36, color: AppColors.border);
}

// ── Study suggestions (fail only) ─────────────────────
class _StudySuggestions extends StatelessWidget {
  final List<String> suggestions;
  const _StudySuggestions({required this.suggestions});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Study Suggestions',
          style:
              Theme.of(context).textTheme.headlineSmall?.copyWith(fontSize: 16)),
      const SizedBox(height: 4),
      Text('AI-recommended topics to help you pass',
          style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: 12),
      ...suggestions.map((s) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.lightbulb_outline_rounded,
                    color: AppColors.primaryLight, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(s,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w500, height: 1.4)),
              ),
            ]),
          )),
    ]);
  }
}
