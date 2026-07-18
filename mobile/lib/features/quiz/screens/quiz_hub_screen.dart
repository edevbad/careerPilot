import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/dummy_data.dart';

class QuizHubScreen extends StatelessWidget {
  const QuizHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final phases = DummyData.quizPhaseStatuses;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Quiz Hub')),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        children: [
          // ── Header banner ────────────────────────
          Container(
            padding: const EdgeInsets.all(18),
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A1030), Color(0xFF0F1629)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
            ),
            child: Row(children: [
              Container(
                width: 50, height: 50,
                decoration: BoxDecoration(gradient: AppColors.primaryGradient, borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.quiz_rounded, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Phase Quizzes', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text('Pass each phase quiz to unlock the next chapter',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.4)),
              ])),
            ]),
          ).animate().fadeIn(duration: 500.ms),

          // ── Phase cards ──────────────────────────
          ...phases.asMap().entries.map((e) {
            final phase = e.value;
            return _QuizPhaseCard(phase: phase, index: e.key);
          }),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _QuizPhaseCard extends StatelessWidget {
  final Map<String, dynamic> phase;
  final int index;
  const _QuizPhaseCard({required this.phase, required this.index});

  @override
  Widget build(BuildContext context) {
    final status = phase['status'] as String;
    final isLocked = status == 'locked';
    final isPassed = status == 'passed';
    final isReady = status == 'ready';
    final isCooldown = status == 'cooldown';

    Color borderColor = AppColors.border;
    if (isReady) borderColor = AppColors.primary.withOpacity(0.5);
    if (isPassed) borderColor = AppColors.success.withOpacity(0.3);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isLocked ? AppColors.surface.withOpacity(0.5) : AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: isReady ? 1.5 : 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: isLocked
                    ? AppColors.surfaceVariant
                    : isPassed
                        ? AppColors.success.withOpacity(0.12)
                        : isReady
                            ? AppColors.primary.withOpacity(0.12)
                            : AppColors.warning.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Center(child: isLocked
                  ? const Icon(Icons.lock_rounded, color: AppColors.textMuted, size: 20)
                  : isPassed
                      ? const Icon(Icons.check_rounded, color: AppColors.success, size: 22)
                      : isReady
                          ? Icon(Icons.play_arrow_rounded, color: AppColors.primary, size: 24)
                          : Icon(Icons.hourglass_top_rounded, color: AppColors.warning, size: 20)),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Phase ${phase['phase']}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.primary)),
              const SizedBox(height: 2),
              Text(phase['title'] as String,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: isLocked ? AppColors.textMuted : AppColors.textPrimary)),
            ])),
            _StatusChip(status),
          ]),

          if (isPassed && phase['bestScore'] != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(children: [
                const Icon(Icons.emoji_events_rounded, color: AppColors.xpGold, size: 18),
                const SizedBox(width: 8),
                Text('Best score: ${phase['bestScore']}%',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.success, fontWeight: FontWeight.w600)),
                const Spacer(),
                const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                const SizedBox(width: 4),
                Text('Passed', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.success)),
              ]),
            ),
          ],

          if (isLocked) ...[
            const SizedBox(height: 10),
            Text('🔒 Complete Phase ${phase['phase'] - 1} and pass its quiz to unlock',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textMuted)),
          ],

          if (isCooldown) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.warning.withOpacity(0.2)),
              ),
              child: Row(children: [
                const Icon(Icons.schedule_rounded, color: AppColors.warning, size: 18),
                const SizedBox(width: 8),
                Text('Retake available in 18h 23m',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.warning, fontWeight: FontWeight.w600)),
              ]),
            ),
          ],

          if (isReady) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: Container(
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 3))],
                ),
                child: Material(color: Colors.transparent, child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => context.push('/quiz/${phase['phase']}'),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                      const SizedBox(width: 6),
                      Text('Start Quiz — ${phase['title'].toString().split(' ')[0]}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                    ]),
                  ),
                )),
              ),
            ),
          ],
        ]),
      ),
    ).animate().fadeIn(duration: 400.ms, delay: Duration(milliseconds: index * 80)).slideY(begin: 0.1, end: 0);
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip(this.status);

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (status) {
      case 'passed': color = AppColors.success; label = 'Passed'; break;
      case 'ready': color = AppColors.primary; label = 'Ready'; break;
      case 'cooldown': color = AppColors.warning; label = 'Cooldown'; break;
      default: color = AppColors.textMuted; label = 'Locked';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 11)),
    );
  }
}
