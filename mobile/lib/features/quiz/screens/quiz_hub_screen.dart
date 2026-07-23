import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/repositories/roadmap_repository.dart';
import '../../../core/repositories/quiz_repository.dart';
import '../../../core/models/roadmap_model.dart';
import '../../../core/models/retake_status_model.dart';

class QuizHubScreen extends StatefulWidget {
  const QuizHubScreen({super.key});

  @override
  State<QuizHubScreen> createState() => _QuizHubScreenState();
}

class _QuizHubScreenState extends State<QuizHubScreen> {
  final _roadmapRepo = RoadmapRepository();
  final _quizRepo = QuizRepository();

  bool _isLoading = true;
  String? _error;
  RoadmapModel? _roadmap;
  List<_PhaseQuizStatus> _phaseStatuses = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      // Load the first active roadmap
      final roadmaps = await _roadmapRepo.getRoadmaps();
      final active = roadmaps.isEmpty
          ? null
          : roadmaps.firstWhere(
              (r) => r.status == 'active',
              orElse: () => roadmaps.first,
            );

      if (active == null) {
        setState(() {
          _roadmap = null;
          _phaseStatuses = [];
          _isLoading = false;
        });
        return;
      }

      // For each phase, fetch retake status
      final statuses = await Future.wait(
        active.phases.map((phase) async {
          try {
            final status = await _quizRepo.getRetakeStatus(active.id, phase.number);
            return _PhaseQuizStatus(phase: phase, retakeStatus: status);
          } catch (_) {
            // If status fetch fails, fall back to locked state based on phase status
            return _PhaseQuizStatus(
              phase: phase,
              retakeStatus: RetakeStatusModel(
                canTake: phase.status == 'active',
                attemptCount: 0,
                studySuggestions: [],
              ),
            );
          }
        }),
      );

      if (mounted) {
        setState(() {
          _roadmap = active;
          _phaseStatuses = statuses;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Quiz Hub'),
        actions: [
          IconButton(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? _ErrorState(error: _error!, onRetry: _loadData)
              : _roadmap == null
                  ? const _NoRoadmapState()
                  : RefreshIndicator(
                      onRefresh: _loadData,
                      color: AppColors.primary,
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        children: [
                          // ── Header banner ────────────────────────
                          _HeaderBanner(roadmapTitle: _roadmap!.targetCareer)
                              .animate()
                              .fadeIn(duration: 500.ms),

                          const SizedBox(height: 8),

                          // ── Phase cards ──────────────────────────
                          ..._phaseStatuses.asMap().entries.map((e) {
                            return _QuizPhaseCard(
                              roadmapId: _roadmap!.id,
                              phaseStatus: e.value,
                              index: e.key,
                            );
                          }),

                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
    );
  }
}

// ── Data model ────────────────────────────────────────
class _PhaseQuizStatus {
  final PhaseModel phase;
  final RetakeStatusModel retakeStatus;
  const _PhaseQuizStatus({required this.phase, required this.retakeStatus});

  String get uiStatus {
    if (phase.status == 'locked') return 'locked';
    return retakeStatus.uiStatus;
  }
}

// ── Header ────────────────────────────────────────────
class _HeaderBanner extends StatelessWidget {
  final String roadmapTitle;
  const _HeaderBanner({required this.roadmapTitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1030), Color(0xFF0F1629)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Row(children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(14)),
          child: const Icon(Icons.quiz_rounded, color: Colors.white, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Phase Quizzes', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              roadmapTitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 2),
            Text(
              'Pass each quiz to unlock the next chapter',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.4),
            ),
          ]),
        ),
      ]),
    );
  }
}

// ── Phase card ────────────────────────────────────────
class _QuizPhaseCard extends StatelessWidget {
  final String roadmapId;
  final _PhaseQuizStatus phaseStatus;
  final int index;
  const _QuizPhaseCard({
    required this.roadmapId,
    required this.phaseStatus,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final phase = phaseStatus.phase;
    final retake = phaseStatus.retakeStatus;
    final status = phaseStatus.uiStatus;

    final isLocked = status == 'locked';
    final isPassed = retake.lastScore != null && retake.lastScore! >= 70;
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
              width: 44,
              height: 44,
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
              child: Center(
                  child: isLocked
                      ? const Icon(Icons.lock_rounded, color: AppColors.textMuted, size: 20)
                      : isPassed
                          ? const Icon(Icons.check_rounded, color: AppColors.success, size: 22)
                          : isReady
                              ? Icon(Icons.play_arrow_rounded, color: AppColors.primary, size: 24)
                              : Icon(Icons.hourglass_top_rounded,
                                  color: AppColors.warning, size: 20)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Phase ${phase.number}',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.primary)),
                const SizedBox(height: 2),
                Text(phase.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: isLocked ? AppColors.textMuted : AppColors.textPrimary)),
              ]),
            ),
            _StatusChip(status, hasPassed: isPassed),
          ]),

          // ── Passed best score banner ──────────────
          if (isPassed) ...[
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
                Text('Best score: ${retake.lastScore}%',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.success, fontWeight: FontWeight.w600)),
                const Spacer(),
                const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                const SizedBox(width: 4),
                Text('Passed',
                    style:
                        Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.success)),
              ]),
            ),
          ],

          // ── Locked message ────────────────────────
          if (isLocked) ...[
            const SizedBox(height: 10),
            Text(
              '🔒 Complete Phase ${phase.number - 1} and pass its quiz to unlock',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppColors.textMuted),
            ),
          ],

          // ── Cooldown banner ───────────────────────
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
                Expanded(
                  child: Text(
                    retake.message ?? 'Retake available soon',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.warning, fontWeight: FontWeight.w600),
                  ),
                ),
              ]),
            ),
          ],

          // ── Study suggestions (cooldown) ──────────
          if (isCooldown && retake.studySuggestions.isNotEmpty) ...[
            const SizedBox(height: 10),
            ...retake.studySuggestions.take(2).map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Icon(Icons.lightbulb_outline_rounded,
                        color: AppColors.xpGold, size: 14),
                    const SizedBox(width: 6),
                    Expanded(
                        child: Text(s,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppColors.textSecondary))),
                  ]),
                )),
          ],

          // ── Start Quiz button ─────────────────────
          if (isReady) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: Container(
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 3))
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => context.push('/quiz/$roadmapId/${phase.number}'),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                        const SizedBox(width: 6),
                        Text(
                          retake.attemptCount > 0
                              ? 'Retake Quiz — ${phase.title.split(' ').first}'
                              : 'Start Quiz — ${phase.title.split(' ').first}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 14),
                        ),
                      ]),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ]),
      ),
    ).animate().fadeIn(duration: 400.ms, delay: Duration(milliseconds: index * 80)).slideY(begin: 0.1, end: 0);
  }
}

// ── Status chip ───────────────────────────────────────
class _StatusChip extends StatelessWidget {
  final String status;
  final bool hasPassed;
  const _StatusChip(this.status, {this.hasPassed = false});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (status) {
      case 'ready':
        color = AppColors.primary;
        label = 'Ready';
        break;
      case 'cooldown':
        color = AppColors.warning;
        label = 'Cooldown';
        break;
      case 'locked':
        color = AppColors.textMuted;
        label = 'Locked';
        break;
      default:
        color = hasPassed ? AppColors.success : AppColors.textMuted;
        label = hasPassed ? 'Passed' : 'Locked';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration:
          BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
      child: Text(label,
          style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 11)),
    );
  }
}

// ── Error state ───────────────────────────────────────
class _ErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorState({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.wifi_off_rounded, size: 48, color: AppColors.textMuted),
          const SizedBox(height: 16),
          Text('Failed to load quiz data',
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(error,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
          ),
        ]),
      ),
    );
  }
}

// ── No roadmap state ──────────────────────────────────
class _NoRoadmapState extends StatelessWidget {
  const _NoRoadmapState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.quiz_outlined, size: 64, color: AppColors.textMuted),
          const SizedBox(height: 16),
          Text('No active roadmap',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(color: AppColors.textMuted)),
          const SizedBox(height: 8),
          Text(
            'Generate a roadmap first to access phase quizzes.',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () => context.go('/roadmap'),
            icon: const Icon(Icons.add_rounded, color: Colors.white),
            label: const Text('Create Roadmap', style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
          ),
        ]),
      ),
    );
  }
}
