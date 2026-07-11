import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/dummy_data.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final user = DummyData.user;
  final roadmap = DummyData.roadmaps[0];
  final tasks = DummyData.todaysTasks;
  final streak = DummyData.streakDays;
  final weeklyXp = DummyData.weeklyXp;

  @override
  Widget build(BuildContext context) {
    final completedToday = tasks.where((t) => t['completed'] as bool).length;
    final xpPercent = (user['xp'] as int) / (user['xpToNextLevel'] as int);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        onRefresh: () async => await Future.delayed(const Duration(seconds: 1)),
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
                        Text('${user['name']} 👋',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  // XP Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: AppColors.xpGradient,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.bolt_rounded, color: Colors.white, size: 16),
                        const SizedBox(width: 4),
                        Text('${user['xp']} XP',
                            style: const TextStyle(
                                color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
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
                  _StreakCard(streak: streak, streakDays: user['streak'] as int)
                      .animate()
                      .fadeIn(duration: 500.ms)
                      .slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 16),

                  // ── Active Roadmap Card ──────────
                  _RoadmapCard(roadmap: roadmap)
                      .animate()
                      .fadeIn(duration: 500.ms, delay: 80.ms)
                      .slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 16),

                  // ── Tasks Summary ────────────────
                  _TasksSummary(
                    completed: completedToday,
                    total: tasks.length,
                    tasks: tasks.take(3).toList(),
                  ).animate().fadeIn(duration: 500.ms, delay: 160.ms).slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 16),

                  // ── XP Level Bar ─────────────────
                  _XpLevelBar(
                    level: user['level'] as int,
                    xp: user['xp'] as int,
                    xpMax: user['xpToNextLevel'] as int,
                    xpPercent: xpPercent,
                  ).animate().fadeIn(duration: 500.ms, delay: 240.ms).slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 16),

                  // ── Weekly XP Chart ──────────────
                  _WeeklyChart(xpData: weeklyXp)
                      .animate()
                      .fadeIn(duration: 500.ms, delay: 320.ms),

                  const SizedBox(height: 16),

                  // ── Quick Actions ────────────────
                  _QuickActions().animate().fadeIn(duration: 500.ms, delay: 400.ms),

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
      case 'completed': return AppColors.success;
      case 'partial': return AppColors.xpGold;
      case 'today': return AppColors.primary;
      default: return AppColors.surfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1030), Color(0xFF0F1629)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
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
                child: const Icon(Icons.local_fire_department_rounded, size: 40, color: Colors.white),
              ),
              Text('$streakDays',
                  style: Theme.of(context).textTheme.headlineLarge
                      ?.copyWith(color: AppColors.xpGold, fontWeight: FontWeight.w800)),
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
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500)),
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
                            color: _dotColor(day['status'] as String).withOpacity(0.2),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _dotColor(day['status'] as String),
                              width: isToday ? 2 : 1.5,
                            ),
                          ),
                          child: day['status'] == 'completed'
                              ? const Icon(Icons.check_rounded, size: 14, color: AppColors.success)
                              : day['status'] == 'today'
                                  ? const Icon(Icons.star_rounded, size: 14, color: AppColors.primary)
                                  : null,
                        ),
                        const SizedBox(height: 4),
                        Text(day['label'] as String,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10)),
                      ],
                    );
                  }).toList(),
                ),
                const SizedBox(height: 10),
                Text("🔥 Keep it up! Complete today's tasks",
                    style: Theme.of(context).textTheme.bodySmall
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
  final Map<String, dynamic> roadmap;
  const _RoadmapCard({required this.roadmap});

  @override
  Widget build(BuildContext context) {
    final completion = (roadmap['overallCompletion'] as double);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0D1F38), Color(0xFF0F1629)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
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
                Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle)),
                const SizedBox(width: 5),
                Text('Active', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.success, fontWeight: FontWeight.w600)),
              ]),
            ),
            const Spacer(),
            Text('${(completion * 100).toInt()}% complete',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.primary)),
          ]),
          const SizedBox(height: 12),
          Text(roadmap['targetCareer'] as String, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Phase ${roadmap['activePhaseNumber']} of ${roadmap['totalPhases']} — JavaScript & TypeScript',
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
              onPressed: () => context.push('/roadmap/${roadmap['id']}'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                minimumSize: const Size(double.infinity, 44),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Continue Learning', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
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
  final List<Map<String, dynamic>> tasks;
  const _TasksSummary({required this.completed, required this.total, required this.tasks});

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
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 15)),
            const Spacer(),
            GestureDetector(
              onTap: () {},
              child: Text('View all',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.primary)),
            ),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            SizedBox(
              width: 48, height: 48,
              child: Stack(alignment: Alignment.center, children: [
                CircularProgressIndicator(
                  value: total > 0 ? completed / total : 0,
                  backgroundColor: AppColors.surfaceVariant,
                  valueColor: const AlwaysStoppedAnimation(AppColors.success),
                  strokeWidth: 4,
                ),
                Text('$completed/$total',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              ]),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('$completed of $total tasks completed',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Row(children: [
                  const Icon(Icons.bolt_rounded, color: AppColors.xpGold, size: 14),
                  Text(' +60 XP earned today',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.xpGold)),
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
                task['completed'] as bool ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                color: task['completed'] as bool ? AppColors.success : AppColors.textMuted,
                size: 18,
              ),
              const SizedBox(width: 10),
              Expanded(child: Text(task['title'] as String,
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: task['completed'] as bool ? AppColors.textMuted : AppColors.textPrimary,
                      decoration: task['completed'] as bool ? TextDecoration.lineThrough : null))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.xpGold.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('+${task['xpReward']} XP',
                    style: const TextStyle(color: AppColors.xpGold, fontSize: 10, fontWeight: FontWeight.w600)),
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
  const _XpLevelBar({required this.level, required this.xp, required this.xpMax, required this.xpPercent});

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
            width: 36, height: 36,
            decoration: BoxDecoration(gradient: AppColors.xpGradient, borderRadius: BorderRadius.circular(10)),
            child: Center(child: Text('$level', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16))),
          ),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Level $level — Intermediate Learner',
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
        Text('XP This Week', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 15)),
        const SizedBox(height: 4),
        Text('${xpData.fold<double>(0, (a, b) => a + b).toInt()} XP earned',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.xpGold)),
        const SizedBox(height: 16),
        SizedBox(
          height: 120,
          child: BarChart(
            BarChartData(
              barTouchData: BarTouchData(enabled: false),
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (val, _) => Text(
                      days[val.toInt()],
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10),
                    ),
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              gridData: const FlGridData(show: false),
              barGroups: List.generate(xpData.length, (i) => BarChartGroupData(
                x: i,
                barRods: [
                  BarChartRodData(
                    toY: xpData[i],
                    gradient: i == 5
                        ? AppColors.xpGradient
                        : LinearGradient(
                            colors: [AppColors.primary, AppColors.secondary],
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
      {'icon': Icons.menu_book_rounded, 'label': 'Resources', 'route': '/resources', 'color': AppColors.info},
      {'icon': Icons.quiz_rounded, 'label': 'Quiz', 'route': '/quiz', 'color': AppColors.primary},
      {'icon': Icons.map_rounded, 'label': 'Roadmap', 'route': '/roadmap', 'color': AppColors.success},
      {'icon': Icons.person_rounded, 'label': 'Profile', 'route': '/profile', 'color': AppColors.xpGold},
    ];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Quick Actions', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 15)),
      const SizedBox(height: 12),
      Row(
        children: actions.map((a) => Expanded(
          child: GestureDetector(
            onTap: () => context.go(a['route'] as String),
            child: Container(
              margin: EdgeInsets.only(right: actions.last == a ? 0 : 10),
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: (a['color'] as Color).withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: (a['color'] as Color).withOpacity(0.25)),
              ),
              child: Column(children: [
                Icon(a['icon'] as IconData, color: a['color'] as Color, size: 24),
                const SizedBox(height: 6),
                Text(a['label'] as String,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
              ]),
            ),
          ),
        )).toList(),
      ),
    ]);
  }
}
