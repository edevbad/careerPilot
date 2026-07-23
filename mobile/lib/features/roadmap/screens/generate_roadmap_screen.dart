import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

import '../../../core/repositories/roadmap_repository.dart';

class GenerateRoadmapScreen extends StatefulWidget {
  const GenerateRoadmapScreen({super.key});
  @override
  State<GenerateRoadmapScreen> createState() => _GenerateRoadmapScreenState();
}

class _GenerateRoadmapScreenState extends State<GenerateRoadmapScreen> {
  final _roadmapRepository = RoadmapRepository();
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
    try {
      String formatDate(DateTime d) =>
          "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";
      
      final roadmap = await _roadmapRepository.generateRoadmap(
        targetCareer: _goalCtrl.text.trim(),
        skillLevel: _skillLevel,
        duration: _duration,
        interests: _interestsCtrl.text.trim(),
        startDate: formatDate(_startDate ?? DateTime.now()),
      );
      if (mounted) {
        // Pop and return true to refresh list screen, or go to details
        context.go('/roadmap/${roadmap.id}');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _generating = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate roadmap: $e'), backgroundColor: AppColors.error),
        );
      }
    }
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
class _Step1 extends StatefulWidget {
  final _GenerateRoadmapScreenState parent;
  const _Step1(this.parent, {super.key});

  @override
  State<_Step1> createState() => _Step1State();
}

class _Step1State extends State<_Step1> {
  final _searchCtrl = TextEditingController();
  bool _showDropdown = false;
  List<String> _filtered = [];

  static const _careers = [
    // Web Development
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    // Mobile
    'Mobile Developer',
    'iOS Developer',
    'Android Developer',
    'Flutter Developer',
    'React Native Developer',
    // Data & AI
    'Data Scientist',
    'Data Analyst',
    'Machine Learning Engineer',
    'AI Engineer',
    'Data Engineer',
    // Cloud & Infrastructure
    'DevOps Engineer',
    'Cloud Engineer',
    'Site Reliability Engineer',
    'Cybersecurity Engineer',
    // Design
    'UI/UX Designer',
    'Product Designer',
    'Graphic Designer',
    // Other Engineering
    'Software Engineer',
    'Blockchain Developer',
    'Game Developer',
    'Embedded Systems Engineer',
    'QA Engineer',
    // Product & Management
    'Product Manager',
    'Technical Project Manager',
    'Scrum Master',
  ];

  @override
  void initState() {
    super.initState();
    _filtered = _careers;
    // Pre-fill search if parent already has a value
    _searchCtrl.text = widget.parent._goalCtrl.text;
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    setState(() {
      _showDropdown = true;
      _filtered = query.isEmpty
          ? _careers
          : _careers
              .where((c) => c.toLowerCase().contains(query.toLowerCase()))
              .toList();
    });
  }

  void _select(String career) {
    _searchCtrl.text = career;
    widget.parent._goalCtrl.text = career;
    widget.parent.setState(() {});
    setState(() => _showDropdown = false);
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final levels = ['Beginner', 'Intermediate', 'Advanced'];

    return GestureDetector(
      // Tap anywhere outside dropdown to close it
      onTap: () => setState(() => _showDropdown = false),
      behavior: HitTestBehavior.translucent,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              'What career are you targeting?',
              style: Theme.of(context).textTheme.headlineSmall,
            ).animate().fadeIn(),
            const SizedBox(height: 6),
            Text(
              'Search or select your target career below',
              style: Theme.of(context).textTheme.bodyMedium,
            ).animate().fadeIn(delay: 100.ms),
            const SizedBox(height: 24),

            // ── Searchable dropdown ──────────────────
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Search input
                TextField(
                  controller: _searchCtrl,
                  onTap: () => setState(() {
                    _showDropdown = true;
                    _filtered = _careers;
                  }),
                  onChanged: _onSearch,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(
                      Icons.work_outline_rounded,
                      color: AppColors.textMuted,
                      size: 20,
                    ),
                    suffixIcon: _searchCtrl.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded,
                                size: 18, color: AppColors.textMuted),
                            onPressed: () {
                              _searchCtrl.clear();
                              widget.parent._goalCtrl.clear();
                              widget.parent.setState(() {});
                              setState(() {
                                _filtered = _careers;
                                _showDropdown = true;
                              });
                            },
                          )
                        : const Icon(Icons.keyboard_arrow_down_rounded,
                            color: AppColors.textMuted),
                    hintText: 'Search careers...',
                    labelText: 'Career Goal',
                  ),
                ),

                // Dropdown list
                if (_showDropdown && _filtered.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    constraints: const BoxConstraints(maxHeight: 220),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      shrinkWrap: true,
                      itemCount: _filtered.length,
                      separatorBuilder: (_, __) => const Divider(
                        height: 1,
                        indent: 16,
                        endIndent: 16,
                        color: AppColors.border,
                      ),
                      itemBuilder: (context, i) {
                        final career = _filtered[i];
                        final isSelected =
                            widget.parent._goalCtrl.text == career;
                        return InkWell(
                          onTap: () => _select(career),
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Icon(
                                  _iconForCareer(career),
                                  size: 16,
                                  color: isSelected
                                      ? AppColors.primary
                                      : AppColors.textMuted,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    career,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: isSelected
                                              ? AppColors.primary
                                              : AppColors.textPrimary,
                                          fontWeight: isSelected
                                              ? FontWeight.w600
                                              : FontWeight.w400,
                                        ),
                                  ),
                                ),
                                if (isSelected)
                                  const Icon(Icons.check_rounded,
                                      size: 16, color: AppColors.primary),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ).animate().fadeIn(duration: 150.ms).slideY(begin: -0.05, end: 0),

                // No results
                if (_showDropdown && _filtered.isEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search_off_rounded,
                            size: 16, color: AppColors.textMuted),
                        const SizedBox(width: 8),
                        Text(
                          'No match — your custom input will be used',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 28),

            // ── Skill level selector (unchanged) ─────
            Text(
              'Current skill level',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
            ),
            const SizedBox(height: 12),
            StatefulBuilder(
              builder: (context, setInner) => Column(
                children: levels.map((l) {
                  final selected = widget.parent._skillLevel == l;
                  return GestureDetector(
                    onTap: () {
                      widget.parent.setState(() => widget.parent._skillLevel = l);
                      setInner(() {});
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.primary.withOpacity(0.12)
                            : AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: selected ? AppColors.primary : AppColors.border,
                          width: selected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(children: [
                        Icon(
                          l == 'Beginner'
                              ? Icons.emoji_events_outlined
                              : l == 'Intermediate'
                                  ? Icons.trending_up_rounded
                                  : Icons.rocket_launch_rounded,
                          color: selected
                              ? AppColors.primary
                              : AppColors.textMuted,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          l,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(
                                color: selected
                                    ? AppColors.primary
                                    : AppColors.textPrimary,
                                fontWeight: selected
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                        ),
                        const Spacer(),
                        if (selected)
                          const Icon(Icons.check_circle_rounded,
                              color: AppColors.primary, size: 20),
                      ]),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  IconData _iconForCareer(String career) {
    if (career.contains('Frontend') || career.contains('UI')) return Icons.web_rounded;
    if (career.contains('Backend')) return Icons.dns_rounded;
    if (career.contains('Full Stack')) return Icons.layers_rounded;
    if (career.contains('Mobile') || career.contains('Flutter') ||
        career.contains('iOS') || career.contains('Android') ||
        career.contains('React Native')) return Icons.smartphone_rounded;
    if (career.contains('Data') || career.contains('ML') ||
        career.contains('AI')) return Icons.insights_rounded;
    if (career.contains('DevOps') || career.contains('Cloud') ||
        career.contains('SRE')) return Icons.cloud_rounded;
    if (career.contains('Security')) return Icons.security_rounded;
    if (career.contains('Designer') || career.contains('UX')) return Icons.palette_rounded;
    if (career.contains('Game')) return Icons.sports_esports_rounded;
    if (career.contains('Blockchain')) return Icons.currency_bitcoin_rounded;
    if (career.contains('QA')) return Icons.bug_report_rounded;
    if (career.contains('Manager') || career.contains('Scrum')) return Icons.manage_accounts_rounded;
    return Icons.work_outline_rounded;
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
