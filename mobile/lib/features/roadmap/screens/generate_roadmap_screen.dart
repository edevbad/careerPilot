import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

class GenerateRoadmapScreen extends StatefulWidget {
  const GenerateRoadmapScreen({super.key});
  @override
  State<GenerateRoadmapScreen> createState() => _GenerateRoadmapScreenState();
}

class _GenerateRoadmapScreenState extends State<GenerateRoadmapScreen> {
  final _pageCtrl = PageController();
  int _step = 0;
  bool _generating = false;

  // Step 1
  final _goalCtrl = TextEditingController(text: 'Full Stack Developer');
  String _skillLevel = 'Intermediate';

  // Step 2
  final _interestsCtrl = TextEditingController(text: 'Web, APIs, React');
  String _duration = '6 months';
  double _hoursPerDay = 2.5;

  // Step 3
  DateTime? _startDate = DateTime.now();

  @override
  void dispose() {
    _pageCtrl.dispose();
    _goalCtrl.dispose();
    _interestsCtrl.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_step < 2) {
      _pageCtrl.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
      setState(() => _step++);
    } else {
      _generate();
    }
  }

  void _prevPage() {
    if (_step > 0) {
      _pageCtrl.previousPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
      setState(() => _step--);
    }
  }

  Future<void> _generate() async {
    setState(() => _generating = true);
    await Future.delayed(const Duration(milliseconds: 2500));
    if (mounted) context.go('/roadmap/r1');
  }

  @override
  Widget build(BuildContext context) {
    if (_generating) return _GeneratingOverlay();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          onPressed: _step > 0 ? _prevPage : () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
        ),
        title: const Text('Generate Roadmap'),
      ),
      body: Column(
        children: [
          // ── Step indicator ──────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Column(children: [
              Row(children: List.generate(3, (i) => Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                  height: 4,
                  decoration: BoxDecoration(
                    color: i <= _step ? AppColors.primary : AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ))),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Step ${_step + 1} of 3',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.primary)),
                Text(['Career Goal', 'Preferences', 'Confirm'][_step],
                    style: Theme.of(context).textTheme.bodySmall),
              ]),
            ]),
          ),

          // ── Page content ────────────────────────
          Expanded(
            child: PageView(
              controller: _pageCtrl,
              physics: const NeverScrollableScrollPhysics(),
              children: [_Step1(this), _Step2(this), _Step3(this)],
            ),
          ),

          // ── CTA button ──────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
              child: _GradientButton(
                label: _step < 2 ? 'Continue' : 'Generate My Roadmap ✨',
                onTap: _nextPage,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step 1: Career Goal ───────────────────────────────
class _Step1 extends StatelessWidget {
  final _GenerateRoadmapScreenState parent;
  const _Step1(this.parent);

  @override
  Widget build(BuildContext context) {
    final levels = ['Beginner', 'Intermediate', 'Advanced'];
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 8),
        Text('What career are you targeting?',
            style: Theme.of(context).textTheme.headlineSmall).animate().fadeIn(),
        const SizedBox(height: 6),
        Text('Be specific — e.g., "Backend Developer", "UX Designer"',
            style: Theme.of(context).textTheme.bodyMedium).animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 24),
        TextField(
          controller: parent._goalCtrl,
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.work_outline_rounded, color: AppColors.textMuted, size: 20),
            hintText: 'e.g. Backend Developer',
            labelText: 'Career Goal',
          ),
        ),
        const SizedBox(height: 28),
        Text('Current skill level', style: Theme.of(context).textTheme.bodyMedium
            ?.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
        const SizedBox(height: 12),
        StatefulBuilder(builder: (context, setInner) => Column(children: levels.map((l) {
          final selected = parent._skillLevel == l;
          return GestureDetector(
            onTap: () {
              parent.setState(() => parent._skillLevel = l);
              setInner(() {});
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: selected ? AppColors.primary.withOpacity(0.12) : AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 1.5 : 1),
              ),
              child: Row(children: [
                Icon(
                  l == 'Beginner' ? Icons.emoji_events_outlined
                      : l == 'Intermediate' ? Icons.trending_up_rounded
                      : Icons.rocket_launch_rounded,
                  color: selected ? AppColors.primary : AppColors.textMuted, size: 20,
                ),
                const SizedBox(width: 12),
                Text(l, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: selected ? AppColors.primary : AppColors.textPrimary,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400)),
                const Spacer(),
                if (selected) const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 20),
              ]),
            ),
          );
        }).toList())),
      ]),
    );
  }
}

// ── Step 2: Preferences ───────────────────────────────
class _Step2 extends StatelessWidget {
  final _GenerateRoadmapScreenState parent;
  const _Step2(this.parent);

  @override
  Widget build(BuildContext context) {
    final durations = ['1 month', '3 months', '6 months', '1 year'];
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 8),
        Text('Customize your learning plan', style: Theme.of(context).textTheme.headlineSmall).animate().fadeIn(),
        const SizedBox(height: 6),
        Text('We use this to generate the right pace and content', style: Theme.of(context).textTheme.bodyMedium).animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 24),
        TextField(
          controller: parent._interestsCtrl,
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.interests_outlined, color: AppColors.textMuted, size: 20),
            labelText: 'Interests / Focus Areas',
            hintText: 'e.g. APIs, React, Cloud',
          ),
        ),
        const SizedBox(height: 24),
        Text('Target duration', style: Theme.of(context).textTheme.bodyMedium
            ?.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
        const SizedBox(height: 10),
        StatefulBuilder(builder: (context, setInner) => Wrap(
          spacing: 8, runSpacing: 8,
          children: durations.map((d) {
            final sel = parent._duration == d;
            return GestureDetector(
              onTap: () { parent.setState(() => parent._duration = d); setInner(() {}); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: sel ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: sel ? AppColors.primary : AppColors.border),
                ),
                child: Text(d, style: TextStyle(
                    color: sel ? AppColors.primary : AppColors.textSecondary,
                    fontWeight: sel ? FontWeight.w600 : FontWeight.w400, fontSize: 13)),
              ),
            );
          }).toList(),
        )),
        const SizedBox(height: 24),
        StatefulBuilder(builder: (context, setInner) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text('Daily study hours', style: Theme.of(context).textTheme.bodyMedium
                ?.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
            const Spacer(),
            Text('${parent._hoursPerDay.toStringAsFixed(1)} hrs/day',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600)),
          ]),
          Slider(
            value: parent._hoursPerDay,
            min: 0.5, max: 8, divisions: 15,
            activeColor: AppColors.primary,
            inactiveColor: AppColors.surfaceVariant,
            onChanged: (v) { parent.setState(() => parent._hoursPerDay = v); setInner(() {}); },
          ),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('30 min', style: Theme.of(context).textTheme.bodySmall),
            Text('8 hours', style: Theme.of(context).textTheme.bodySmall),
          ]),
        ])),
      ]),
    );
  }
}

// ── Step 3: Confirm ───────────────────────────────────
class _Step3 extends StatelessWidget {
  final _GenerateRoadmapScreenState parent;
  const _Step3(this.parent);

  @override
  Widget build(BuildContext context) {
    final rows = [
      {'label': 'Career Goal', 'value': parent._goalCtrl.text, 'icon': Icons.work_outline_rounded},
      {'label': 'Skill Level', 'value': parent._skillLevel, 'icon': Icons.trending_up_rounded},
      {'label': 'Interests', 'value': parent._interestsCtrl.text, 'icon': Icons.interests_outlined},
      {'label': 'Duration', 'value': parent._duration, 'icon': Icons.calendar_month_rounded},
      {'label': 'Daily Hours', 'value': '${parent._hoursPerDay.toStringAsFixed(1)} hrs', 'icon': Icons.timer_outlined},
    ];
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 8),
        Text('Review your plan', style: Theme.of(context).textTheme.headlineSmall).animate().fadeIn(),
        const SizedBox(height: 6),
        Text('Our AI will generate a personalized roadmap for you', style: Theme.of(context).textTheme.bodyMedium).animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(children: List.generate(rows.length, (i) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              border: i < rows.length - 1 ? const Border(bottom: BorderSide(color: AppColors.border)) : null,
            ),
            child: Row(children: [
              Icon(rows[i]['icon'] as IconData, color: AppColors.primary, size: 18),
              const SizedBox(width: 12),
              Text(rows[i]['label'] as String, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textMuted)),
              const Spacer(),
              Text(rows[i]['value'] as String, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
            ]),
          ))),
        ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primary.withOpacity(0.2)),
          ),
          child: Row(children: [
            const Icon(Icons.auto_awesome_rounded, color: AppColors.primaryLight, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(
              'AI will generate a phased roadmap with daily tasks, quizzes, and curated resources.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.primaryLight, height: 1.5),
            )),
          ]),
        ).animate().fadeIn(delay: 200.ms),
      ]),
    );
  }
}

// ── Generating overlay ────────────────────────────────
class _GeneratingOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 30)],
            ),
            child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 40),
          ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 1500.ms, color: AppColors.primaryLight.withOpacity(0.4)),
          const SizedBox(height: 28),
          Text('Building your roadmap...', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('AI is personalizing your learning path', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 32),
          const CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
        ]).animate().fadeIn(duration: 500.ms),
      ),
    );
  }
}

// ── Gradient button ───────────────────────────────────
class _GradientButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  const _GradientButton({required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      gradient: AppColors.primaryGradient,
      borderRadius: BorderRadius.circular(12),
      boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.35), blurRadius: 16, offset: const Offset(0, 4))],
    ),
    child: Material(color: Colors.transparent, child: InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(height: 52, alignment: Alignment.center,
        child: Text(label, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.white, fontSize: 15))),
    )),
  );
}
