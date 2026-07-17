import 'package:careerpilot_mobile/core/constants/dummy_data.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/repositories/task_repository.dart';
import '../../../core/models/task_model.dart';
import '../../../core/models/task_history_model.dart';
import '../../../core/repositories/progress_repository.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});
  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final _taskRepository = TaskRepository();
  final _progressRepository = ProgressRepository();
  List<TaskModel> tasks = [];
  List<TaskHistoryModel> _history = [];
  bool _calendarExpanded = false;
  bool _isLoading = true;
  String? _error;
  int _streak = 0;

  @override
  void initState() {
    super.initState();
    _loadTasksData();
  }

  Future<void> _loadTasksData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final taskResult = await _taskRepository.getTodaysTasks();
      final progressSummary = await _progressRepository.getSummary();

      final now = DateTime.now();
      final startDate = now.subtract(const Duration(days: 6));
      String formatDate(DateTime d) =>
          "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";

      final history = await _taskRepository.getTaskHistory(
        startDate: formatDate(startDate),
        endDate: formatDate(now),
      );

      if (mounted) {
        setState(() {
          tasks = taskResult.tasks;
          _history = history;
          _streak = progressSummary.streak;
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

  Future<void> _completeTask(int index) async {
    final task = tasks[index];
    try {
      final result = await _taskRepository.completeTask(task.id);

      // Update state with result
      setState(() {
        tasks[index] = result.task;
        _streak = result.streak;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.success,
            duration: const Duration(seconds: 2),
            content: Row(children: [
              const Icon(Icons.check_circle_rounded,
                  color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text('Task done! +${result.xpEarned} XP 🎉',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w600)),
            ]),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed to complete task: $e'),
              backgroundColor: AppColors.error),
        );
      }
    }
  }

  void _showSkipSheet(int index) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _SkipSheet(
        taskTitle: tasks[index].title,
        onSkip: (reason) async {
          Navigator.pop(context);
          try {
            final updatedTask =
                await _taskRepository.skipTask(tasks[index].id, reason);
            setState(() {
              tasks[index] = updatedTask;
            });
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                    content: Text('Failed to skip task: $e'),
                    backgroundColor: AppColors.error),
              );
            }
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body:
            Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _loadTasksData,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final completed = tasks.where((t) => t.isCompleted).length;
    final active = tasks.where((t) => t.isPending).toList();
    final done = tasks.where((t) => t.isCompleted).toList();
    final skipped = tasks.where((t) => t.isSkipped).toList();
    final allDone = [...done, ...skipped];
    final progress = tasks.isEmpty ? 0.0 : completed / tasks.length;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        onRefresh: _loadTasksData,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              floating: false,
              backgroundColor: AppColors.background,
              title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Daily Tasks',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontSize: 20)),
                    Text(_todayDate(),
                        style: Theme.of(context).textTheme.bodySmall),
                  ]),
              actions: [
                GestureDetector(
                  onTap: () =>
                      setState(() => _calendarExpanded = !_calendarExpanded),
                  child: Container(
                    margin: const EdgeInsets.only(right: 16),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: AppColors.streakGradient,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(children: [
                      const Icon(Icons.local_fire_department_rounded,
                          color: Colors.white, size: 16),
                      const SizedBox(width: 4),
                      Text('7',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 14)),
                    ]),
                  ),
                ),
              ],
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ── Streak calendar ───────────────
                  AnimatedSize(
                    duration: const Duration(milliseconds: 300),
                    child: _calendarExpanded
                        ? _StreakCalendar()
                        : const SizedBox.shrink(),
                  ),

                  const SizedBox(height: 16),

                  // ── Progress bar ──────────────────
                  _ProgressSummary(
                          completed: completed,
                          total: tasks.length,
                          progress: progress)
                      .animate()
                      .fadeIn(duration: 400.ms),

                  const SizedBox(height: 20),

                  // ── Active tasks ──────────────────
                  if (active.isNotEmpty) ...[
                    _SectionHeader('Remaining Tasks (${active.length})'),
                    const SizedBox(height: 10),
                    ...active.asMap().entries.map((e) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _TaskCard(
                            task: e.value,
                            taskIndex: tasks.indexOf(e.value),
                            onComplete: () =>
                                _completeTask(tasks.indexOf(e.value)),
                            onSkip: () =>
                                _showSkipSheet(tasks.indexOf(e.value)),
                          ).animate().fadeIn(
                              duration: 400.ms,
                              delay: Duration(milliseconds: e.key * 60)),
                        )),
                    const SizedBox(height: 16),
                  ],

                  // ── Completed / Skipped tasks ──────
                  if (allDone.isNotEmpty) ...[
                    _SectionHeader('Completed (${allDone.length})'),
                    const SizedBox(height: 10),
                    ...allDone.map((t) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _DoneTaskRow(task: t),
                        )),
                  ],

                  const SizedBox(height: 40),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _todayDate() {
    final now = DateTime.now();
    final days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${days[now.weekday - 1]}, ${now.day} ${months[now.month - 1]}';
  }
}

// ── Streak Calendar ───────────────────────────────────
class _StreakCalendar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final days = DummyData.streakDays;
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('7-Day Streak',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontSize: 13)),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: days.map((d) {
            Color c;
            switch (d['status']) {
              case 'completed':
                c = AppColors.success;
                break;
              case 'partial':
                c = AppColors.xpGold;
                break;
              case 'today':
                c = AppColors.primary;
                break;
              default:
                c = AppColors.surfaceVariant;
            }
            return Column(children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: c.withOpacity(0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: c, width: 1.5),
                ),
                child: d['status'] == 'completed'
                    ? const Icon(Icons.check_rounded,
                        size: 15, color: AppColors.success)
                    : null,
              ),
              const SizedBox(height: 4),
              Text(d['label'] as String,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(fontSize: 10)),
            ]);
          }).toList(),
        ),
      ]),
    );
  }
}

// ── Progress summary ──────────────────────────────────
class _ProgressSummary extends StatelessWidget {
  final int completed, total;
  final double progress;
  const _ProgressSummary(
      {required this.completed, required this.total, required this.progress});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(children: [
          Row(children: [
            Text('$completed of $total tasks completed',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontSize: 14)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                  color: AppColors.xpGold.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8)),
              child: Row(children: [
                const Icon(Icons.bolt_rounded,
                    color: AppColors.xpGold, size: 14),
                Text('+${completed * 30} XP',
                    style: const TextStyle(
                        color: AppColors.xpGold,
                        fontWeight: FontWeight.w700,
                        fontSize: 12)),
              ]),
            ),
          ]),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppColors.surfaceVariant,
              valueColor: const AlwaysStoppedAnimation(AppColors.success),
              minHeight: 7,
            ),
          ),
        ]),
      );
}

// ── Section header ────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String text;
  const _SectionHeader(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: Theme.of(context)
          .textTheme
          .bodyMedium
          ?.copyWith(color: AppColors.textMuted, fontWeight: FontWeight.w600));
}

// ── Task Card ─────────────────────────────────────────
class _TaskCard extends StatefulWidget {
  final TaskModel task;
  final int taskIndex;
  final VoidCallback onComplete;
  final VoidCallback onSkip;

  const _TaskCard({
    super.key,
    required this.task,
    required this.taskIndex,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<_TaskCard> createState() => _TaskCardState();
}

class _TaskCardState extends State<_TaskCard> {
  bool _expanded = false;

  IconData _typeIcon(String type) {
    switch (type) {
      case 'video':
        return Icons.play_circle_outline_rounded;
      case 'coding':
        return Icons.code_rounded;
      case 'project':
        return Icons.build_circle_outlined;
      default:
        return Icons.menu_book_rounded;
    }
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'video':
        return AppColors.error;
      case 'coding':
        return AppColors.info;
      case 'project':
        return AppColors.warning;
      default:
        return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    final type = widget.task.taskType as String;
    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: _typeColor(type).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(_typeIcon(type), color: _typeColor(type), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(widget.task.title as String,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontSize: 13, height: 1.3)),
                    const SizedBox(height: 5),
                    Row(children: [
                      _MiniChip('~${widget.task.estimatedMinutes} min',
                          Icons.timer_outlined, AppColors.textMuted),
                      const SizedBox(width: 6),
                      _MiniChip('+${widget.task.xpReward} XP',
                          Icons.bolt_rounded, AppColors.xpGold),
                    ]),
                  ])),
              Icon(
                  _expanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: AppColors.textMuted,
                  size: 20),
            ]),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            child: _expanded
                ? Padding(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 0),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Divider(color: AppColors.border),
                          Text(widget.task.description as String,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(height: 1.55)),
                          const SizedBox(height: 14),
                        ]),
                  )
                : const SizedBox.shrink(),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: widget.onSkip,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textMuted,
                    side: const BorderSide(color: AppColors.border),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    minimumSize: const Size(0, 38),
                  ),
                  child: const Text('Skip', style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: widget.onComplete,
                  icon: const Icon(Icons.check_rounded,
                      size: 16, color: Colors.white),
                  label: const Text('Complete',
                      style: TextStyle(color: Colors.white, fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    minimumSize: const Size(0, 38),
                  ),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  const _MiniChip(this.label, this.icon, this.color);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6)),
        child: Row(children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 3),
          Text(label,
              style: TextStyle(
                  color: color, fontSize: 10, fontWeight: FontWeight.w600)),
        ]),
      );
}

// ── Done task row ──────────────────────────────────────
class _DoneTaskRow extends StatelessWidget {
  final TaskModel task;

  const _DoneTaskRow({
    super.key,
    required this.task,
  });
  @override
  Widget build(BuildContext context) {
    final skipped = task.isSkipped as bool;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(children: [
        Icon(skipped ? Icons.skip_next_rounded : Icons.check_circle_rounded,
            color: skipped ? AppColors.textMuted : AppColors.success, size: 18),
        const SizedBox(width: 10),
        Expanded(
            child: Text(task.title as String,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textMuted,
                    decoration: TextDecoration.lineThrough))),
        if (!skipped)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
                color: AppColors.xpGold.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6)),
            child: Text('+${task.xpReward} XP',
                style: const TextStyle(
                    color: AppColors.xpGold,
                    fontSize: 10,
                    fontWeight: FontWeight.w600)),
          ),
      ]),
    );
  }
}

// ── Skip bottom sheet ─────────────────────────────────
class _SkipSheet extends StatefulWidget {
  final String taskTitle;
  final ValueChanged<String> onSkip;
  const _SkipSheet({required this.taskTitle, required this.onSkip});
  @override
  State<_SkipSheet> createState() => _SkipSheetState();
}

class _SkipSheetState extends State<_SkipSheet> {
  String? _selected;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                  child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              Text('Skip Task',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 6),
              Text('Why are you skipping this task?',
                  style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 16),
              ...DummyData.skipReasons.map((r) => GestureDetector(
                    onTap: () => setState(() => _selected = r),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: _selected == r
                            ? AppColors.primary.withOpacity(0.1)
                            : AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: _selected == r
                                ? AppColors.primary
                                : AppColors.border),
                      ),
                      child: Row(children: [
                        Icon(
                            _selected == r
                                ? Icons.radio_button_checked_rounded
                                : Icons.radio_button_unchecked_rounded,
                            color: _selected == r
                                ? AppColors.primary
                                : AppColors.textMuted,
                            size: 18),
                        const SizedBox(width: 10),
                        Text(r,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                    color: _selected == r
                                        ? AppColors.primary
                                        : AppColors.textPrimary)),
                      ]),
                    ),
                  )),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient:
                      _selected != null ? AppColors.primaryGradient : null,
                  color: _selected == null ? AppColors.surfaceVariant : null,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: _selected != null
                          ? () => widget.onSkip(_selected!)
                          : null,
                      child: Container(
                          height: 48,
                          alignment: Alignment.center,
                          child: Text('Skip Task',
                              style: TextStyle(
                                  color: _selected != null
                                      ? Colors.white
                                      : AppColors.textMuted,
                                  fontWeight: FontWeight.w600))),
                    )),
              ),
            ]),
      );
}
