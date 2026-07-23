import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/dummy_data.dart';

import '../../../core/repositories/auth_repository.dart';
import '../../../core/repositories/roadmap_repository.dart';
import '../../../core/repositories/task_repository.dart';
import '../../../core/repositories/progress_repository.dart';
import '../../../core/auth/auth_controller.dart';
import '../../../core/models/user_model.dart';
import '../../../core/models/roadmap_model.dart';
import '../../../core/models/task_model.dart';
import '../../../core/models/progress_summary_model.dart';
import '../../../core/models/task_history_model.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _authRepository = AuthRepository();
  final _roadmapRepository = RoadmapRepository();
  final _taskRepository = TaskRepository();
  final _progressRepository = ProgressRepository();

  bool _isLoading = true;
  String? _error;

  UserModel? _user;
  RoadmapModel? _activeRoadmap;
  List<TaskModel> _tasks = [];
  ProgressSummaryModel _progressSummary = ProgressSummaryModel.empty();
  List<TaskHistoryModel> _history = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Load current user profile
      final user = await _authRepository.getProfile();
      AuthController.instance.updateCurrentUser(user);

      // Load roadmaps & find first active one
      final roadmaps = await _roadmapRepository.getRoadmaps();
      final active = roadmaps.cast<RoadmapModel?>().firstWhere(
            (r) => r?.status == 'active',
            orElse: () => roadmaps.isNotEmpty ? roadmaps.first : null,
          );

      // Load today's tasks
      final taskResult = await _taskRepository.getTodaysTasks();

      // Load progress summary
      final summary = await _progressRepository.getSummary();

      // Load weekly history to build chart/streak representation
      final now = DateTime.now();
      final startDate = now.subtract(const Duration(days: 6));
      const dateFormat = 'yyyy-MM-dd';
      String formatDate(DateTime d) =>
          "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";
      final history = await _taskRepository.getTaskHistory(
        startDate: formatDate(startDate),
        endDate: formatDate(now),
      );

      if (mounted) {
        setState(() {
          _user = user;
          _activeRoadmap = active;
          _tasks = taskResult.tasks;
          _progressSummary = summary;
          _history = history;
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
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded,
                    color: AppColors.error, size: 48),
                const SizedBox(height: 16),
                Text(_error!,
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _loadDashboardData,
                  style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary),
                  child: const Text('Retry',
                      style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final userObj = _user ?? AuthController.instance.currentUser;
    final userName = userObj?.name ?? 'Learner';
    // Use derived totalXp as level XP or custom scale
    final xp = _progressSummary.totalXp;
    // Simple custom level system: 500 XP per level
    final level = (xp / 500).floor() + 1;
    final xpInCurrentLevel = xp % 500;
    const xpMax = 500;
    final xpPercent = xpInCurrentLevel / xpMax;

    final completedToday = _tasks.where((t) => t.isCompleted).length;
    final totalToday = _tasks.length;

    // Convert history list to double array for weekly chart (showing XP earned each day)
    // Ensure we have exactly 7 entries for last 7 days matching history
    final weeklyXpData = List<double>.generate(7, (i) {
      if (i < _history.length) return _history[i].xpEarned.toDouble();
      return 0.0;
    });

    // Create a 7-day streak representation from the history
    final streakList = List.generate(7, (i) {
      final now = DateTime.now();
      final targetDate = now.subtract(Duration(days: 6 - i));
      String formatDate(DateTime d) =>
          "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";
      final dayStr = formatDate(targetDate);
      final dayLabel = [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun'
      ][targetDate.weekday - 1];

      final matchingHistory = _history.cast<TaskHistoryModel?>().firstWhere(
            (h) => h?.date == dayStr,
            orElse: () => null,
          );

      String status = 'pending';
      if (matchingHistory != null) {
        status = matchingHistory.status;
      }
      if (formatDate(now) == dayStr) {
        status = 'today';
      }

      return {'label': dayLabel, 'status': status};
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        onRefresh: _loadDashboardData,
        child: CustomScrollView(
          slivers: [
            // ── App Bar ─────────────────────────────
            SliverAppBar(
              expandedHeight: 0,
              floating: true,
              backgroundColor: AppColors.background,
              title: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Good morning,',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppColors.textMuted)),
                        Text('$userName 👋',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  // XP Badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: AppColors.xpGradient,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.bolt_rounded,
                            color: Colors.white, size: 16),
                        const SizedBox(width: 4),
                        Text('$xp XP',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const SizedBox(height: 12),

                  // ── Streak Card ──────────────────
                  _StreakCard(
                          streak: streakList,
                          streakDays: _progressSummary.streak)
                      .animate()
                      .fadeIn(duration: 500.ms)
                      .slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 16),

                  // ── Active Roadmap Card ──────────
                  if (_activeRoadmap != null)
                    _RoadmapCard(roadmap: _activeRoadmap!)
                        .animate()
                        .fadeIn(duration: 500.ms, delay: 80.ms)
                        .slideY(begin: 0.2, end: 0)
                  else
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.map_outlined,
                              color: AppColors.textMuted, size: 36),
                          const SizedBox(height: 10),
                          Text('No active roadmaps',
                              style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 14),
                          ElevatedButton(
                            onPressed: () => context.push('/roadmap/generate'),
                            style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary),
                            child: const Text('Generate Roadmap ✨',
                                style: TextStyle(color: Colors.white)),
                          )
                        ],
                      ),
                    ).animate().fadeIn(duration: 500.ms),

                  const SizedBox(height: 16),

                  // ── Tasks Summary ────────────────
                  _TasksSummary(
                    completed: completedToday,
                    total: totalToday,
                    tasks: _tasks.take(3).toList(),
                  )
                      .animate()
                      .fadeIn(duration: 500.ms, delay: 160.ms)
                      .slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 16),

                  // ── XP Level Bar ─────────────────
                  _XpLevelBar(
                    level: level,
                    xp: xpInCurrentLevel,
                    xpMax: xpMax,
                    xpPercent: xpPercent,
                  )
                      .animate()
                      .fadeIn(duration: 500.ms, delay: 240.ms)
                      .slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 16),

                  // ── Weekly XP Chart ──────────────
                  _WeeklyChart(xpData: weeklyXpData)
                      .animate()
                      .fadeIn(duration: 500.ms, delay: 320.ms),

                  const SizedBox(height: 16),

                  // ── Quick Actions ────────────────
                  _QuickActions()
                      .animate()
                      .fadeIn(duration: 500.ms, delay: 400.ms),

                  const SizedBox(height: 32),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Streak Card ───────────────────────────────────────
class _StreakCard extends StatelessWidget {
  final List<Map<String, dynamic>> streak;
  final int streakDays;
  const _StreakCard({required this.streak, required this.streakDays});

  Color _dotColor(String status) {
    switch (status) {
      case 'completed':
        return AppColors.success;
      case 'partial':
        return AppColors.xpGold;
      case 'today':
        return AppColors.primary;
      default:
        return AppColors.surfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1030), Color(0xFF0F1629)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.warning.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          // Flame + number
          Column(
            children: [
              ShaderMask(
                shaderCallback: (b) => AppColors.streakGradient.createShader(b),
                child: const Icon(Icons.local_fire_department_rounded,
                    size: 40, color: Colors.white),
              ),
              Text('$streakDays',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: AppColors.xpGold, fontWeight: FontWeight.w800)),
              Text('day streak', style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(width: 20),
          // Day dots
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("This week's progress",
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(fontWeight: FontWeight.w500)),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: streak.map((day) {
                    final isToday = day['status'] == 'today';
                    return Column(
                      children: [
                        Container(
                          width: isToday ? 30 : 26,
                          height: isToday ? 30 : 26,
                          decoration: BoxDecoration(
                            color: _dotColor(day['status'] as String)
                                .withOpacity(0.2),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _dotColor(day['status'] as String),
                              width: isToday ? 2 : 1.5,
                            ),
                          ),
                          child: day['status'] == 'completed'
                              ? const Icon(Icons.check_rounded,
                                  size: 14, color: AppColors.success)
                              : day['status'] == 'today'
                                  ? const Icon(Icons.star_rounded,
                                      size: 14, color: AppColors.primary)
                                  : null,
                        ),
                        const SizedBox(height: 4),
                        Text(day['label'] as String,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(fontSize: 10)),
                      ],
                    );
                  }).toList(),
                ),
                const SizedBox(height: 10),
                Text("🔥 Keep it up! Complete today's tasks",
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.xpGoldLight)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Roadmap Card ─────────────────────────────────────
class _RoadmapCard extends StatelessWidget {
  final RoadmapModel roadmap;
  const _RoadmapCard({required this.roadmap});

  @override
  Widget build(BuildContext context) {
    final completion = roadmap.overallCompletion;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0D1F38), Color(0xFF0F1629)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.info.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(children: [
                Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                        color: AppColors.success, shape: BoxShape.circle)),
                const SizedBox(width: 5),
                Text('Active',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.success, fontWeight: FontWeight.w600)),
              ]),
            ),
            const Spacer(),
            Text('${(completion * 100).toInt()}% complete',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppColors.primary)),
          ]),
          const SizedBox(height: 12),
          Text(roadmap.targetCareer,
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Phase ${roadmap.activePhaseNumber} of ${roadmap.phases.length}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: completion,
              backgroundColor: AppColors.surfaceVariant,
              valueColor: const AlwaysStoppedAnimation(AppColors.primary),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.push('/roadmap/${roadmap.id}'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                minimumSize: const Size(double.infinity, 44),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Continue Learning',
                      style: TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w600)),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded,
                      color: Colors.white, size: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Tasks Summary ─────────────────────────────────────
class _TasksSummary extends StatelessWidget {
  final int completed, total;
  final List<TaskModel> tasks;
  const _TasksSummary(
      {required this.completed, required this.total, required this.tasks});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text("Today's Tasks",
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontSize: 15)),
            const Spacer(),
            GestureDetector(
              onTap: () => context.go('/tasks'),
              child: Text('View all',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: AppColors.primary)),
            ),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            SizedBox(
              width: 48,
              height: 48,
              child: Stack(alignment: Alignment.center, children: [
                CircularProgressIndicator(
                  value: total > 0 ? completed / total : 0,
                  backgroundColor: AppColors.surfaceVariant,
                  valueColor: const AlwaysStoppedAnimation(AppColors.success),
                  strokeWidth: 4,
                ),
                Text('$completed/$total',
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
              ]),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('$completed of $total tasks completed',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Row(children: [
                      const Icon(Icons.bolt_rounded,
                          color: AppColors.xpGold, size: 14),
                      Text(' +${completed * 30} XP earned today',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: AppColors.xpGold)),
                    ]),
                  ]),
            ),
          ]),
          const SizedBox(height: 12),
          const Divider(color: AppColors.border),
          const SizedBox(height: 8),
          ...tasks.map((task) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(children: [
                  Icon(
                    task.isCompleted
                        ? Icons.check_circle_rounded
                        : Icons.radio_button_unchecked_rounded,
                    color: task.isCompleted
                        ? AppColors.success
                        : AppColors.textMuted,
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                      child: Text(task.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(
                                  color: task.isCompleted
                                      ? AppColors.textMuted
                                      : AppColors.textPrimary,
                                  decoration: task.isCompleted
                                      ? TextDecoration.lineThrough
                                      : null))),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.xpGold.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('+${task.xpReward} XP',
                        style: const TextStyle(
                            color: AppColors.xpGold,
                            fontSize: 10,
                            fontWeight: FontWeight.w600)),
                  ),
                ]),
              )),
        ],
      ),
    );
  }
}

// ── XP Level Bar ──────────────────────────────────────
class _XpLevelBar extends StatelessWidget {
  final int level, xp, xpMax;
  final double xpPercent;
  const _XpLevelBar(
      {required this.level,
      required this.xp,
      required this.xpMax,
      required this.xpPercent});

  String _levelTitle(int level) {
    if (level <= 2) return 'Beginner';
    if (level <= 5) return 'Novice Learner';
    if (level <= 10) return 'Intermediate Learner';
    if (level <= 15) return 'Advanced Learner';
    if (level <= 20) return 'Expert';
    return 'Master';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
                gradient: AppColors.xpGradient,
                borderRadius: BorderRadius.circular(10)),
            child: Center(
                child: Text('$level',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 16))),
          ),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Level $level — ${_levelTitle(level)}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
            Text('$xp / $xpMax XP to Level ${level + 1}',
                style: Theme.of(context).textTheme.bodySmall),
          ]),
        ]),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: xpPercent,
            backgroundColor: AppColors.surfaceVariant,
            valueColor: AlwaysStoppedAnimation(AppColors.xpGold),
            minHeight: 8,
          ),
        ),
        const SizedBox(height: 6),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('0 XP', style: Theme.of(context).textTheme.bodySmall),
          Text('$xpMax XP', style: Theme.of(context).textTheme.bodySmall),
        ]),
      ]),
    );
  }
}

// ── Weekly XP Chart ───────────────────────────────────
class _WeeklyChart extends StatelessWidget {
  final List<double> xpData;
  const _WeeklyChart({required this.xpData});

  @override
  Widget build(BuildContext context) {
    final days = DummyData.weekDays;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('XP This Week',
            style:
                Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 15)),
        const SizedBox(height: 4),
        Text('${xpData.fold<double>(0, (a, b) => a + b).toInt()} XP earned',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: AppColors.xpGold)),
        const SizedBox(height: 16),
        SizedBox(
          height: 120,
          child: BarChart(
            BarChartData(
              barTouchData: BarTouchData(enabled: false),
              titlesData: FlTitlesData(
                leftTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (val, _) => Text(
                      days[val.toInt()],
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(fontSize: 10),
                    ),
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              gridData: const FlGridData(show: false),
              barGroups: List.generate(
                  xpData.length,
                  (i) => BarChartGroupData(
                        x: i,
                        barRods: [
                          BarChartRodData(
                            toY: xpData[i],
                            gradient: i == 5
                                ? AppColors.xpGradient
                                : LinearGradient(
                                    colors: [
                                      AppColors.primary,
                                      AppColors.secondary
                                    ],
                                    begin: Alignment.bottomCenter,
                                    end: Alignment.topCenter,
                                  ),
                            width: 22,
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ],
                      )),
            ),
          ),
        ),
      ]),
    );
  }
}

// ── Quick Actions ─────────────────────────────────────
class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      {
        'icon': Icons.menu_book_rounded,
        'label': 'Resources',
        'route': '/resources',
        'color': AppColors.info
      },
      {
        'icon': Icons.quiz_rounded,
        'label': 'Quiz',
        'route': '/quiz',
        'color': AppColors.primary
      },
      {
        'icon': Icons.map_rounded,
        'label': 'Roadmap',
        'route': '/roadmap',
        'color': AppColors.success
      },
      {
        'icon': Icons.person_rounded,
        'label': 'Profile',
        'route': '/profile',
        'color': AppColors.xpGold
      },
    ];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Quick Actions',
          style:
              Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 15)),
      const SizedBox(height: 12),
      Row(
        children: actions
            .map((a) => Expanded(
                  child: GestureDetector(
                    onTap: () => context.go(a['route'] as String),
                    child: Container(
                      margin:
                          EdgeInsets.only(right: actions.last == a ? 0 : 10),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: (a['color'] as Color).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: (a['color'] as Color).withOpacity(0.25)),
                      ),
                      child: Column(children: [
                        Icon(a['icon'] as IconData,
                            color: a['color'] as Color, size: 24),
                        const SizedBox(height: 6),
                        Text(a['label'] as String,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                    fontSize: 11,
                                    color: AppColors.textSecondary,
                                    fontWeight: FontWeight.w500)),
                      ]),
                    ),
                  ),
                ))
            .toList(),
      ),
    ]);
  }
}
