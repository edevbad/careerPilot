import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/dummy_data.dart';

class ActiveQuizScreen extends StatefulWidget {
  final int phaseNumber;
  const ActiveQuizScreen({super.key, required this.phaseNumber});
  @override
  State<ActiveQuizScreen> createState() => _ActiveQuizScreenState();
}

class _ActiveQuizScreenState extends State<ActiveQuizScreen> {
  final PageController _pageCtrl = PageController();
  int _currentIndex = 0;
  final Map<int, int> _answers = {};     // qIndex → optionIndex (MCQ/Code)
  final Map<int, bool> _tfAnswers = {};  // qIndex → bool (TF)
  bool _submitting = false;

  List<Map<String, dynamic>> get questions => List<Map<String, dynamic>>.from(DummyData.quizQuestions);

  bool get _allAnswered => questions.asMap().keys.every((i) {
    final q = questions[i];
    return q['type'] == 'truefalse' ? _tfAnswers.containsKey(i) : _answers.containsKey(i);
  });

  void _goTo(int i) {
    _pageCtrl.animateToPage(i, duration: const Duration(milliseconds: 350), curve: Curves.easeInOut);
    setState(() => _currentIndex = i);
  }

  Future<void> _submit() async {
    final unanswered = questions.length - _answers.length - _tfAnswers.length;
    if (unanswered > 0) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Submit Quiz?', style: TextStyle(color: AppColors.textPrimary)),
          content: Text('$unanswered question${unanswered > 1 ? 's' : ''} unanswered. Submit anyway?',
              style: const TextStyle(color: AppColors.textSecondary)),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Review')),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Submit', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      if (confirm != true) return;
    }

    setState(() => _submitting = true);
    await Future.delayed(const Duration(milliseconds: 1800));

    if (mounted) {
      // Calculate dummy score
      int correct = 0;
      for (int i = 0; i < questions.length; i++) {
        final q = questions[i];
        if (q['type'] == 'truefalse') {
          if (_tfAnswers[i] == q['correctAnswer']) correct++;
        } else {
          if (_answers[i] == q['correctAnswer']) correct++;
        }
      }
      final score = ((correct / questions.length) * 100).round();
      context.go('/quiz/results', extra: {'passed': score >= 70, 'score': score});
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_submitting) return _GradingOverlay();
    final q = questions[_currentIndex];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: Container(
            width: 34, height: 34,
            decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.close_rounded, size: 18, color: AppColors.textPrimary),
          ),
        ),
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Phase ${widget.phaseNumber} Quiz',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14)),
          Text('Question ${_currentIndex + 1} of ${questions.length}',
              style: Theme.of(context).textTheme.bodySmall),
        ]),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: (_currentIndex + 1) / questions.length,
            backgroundColor: AppColors.surfaceVariant,
            valueColor: const AlwaysStoppedAnimation(AppColors.primary),
            minHeight: 3,
          ),
        ),
      ),
      body: Column(
        children: [
          // ── Question PageView ─────────────────────
          Expanded(
            child: PageView.builder(
              controller: _pageCtrl,
              onPageChanged: (i) => setState(() => _currentIndex = i),
              itemCount: questions.length,
              itemBuilder: (_, i) {
                final question = questions[i];
                return _QuestionPage(
                  question: question,
                  questionIndex: i,
                  selectedMcq: _answers[i],
                  selectedTf: _tfAnswers[i],
                  onMcqSelect: (opt) => setState(() => _answers[i] = opt),
                  onTfSelect: (val) => setState(() => _tfAnswers[i] = val),
                );
              },
            ),
          ),

          // ── Dot navigation ────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(questions.length, (i) {
              final answered = questions[i]['type'] == 'truefalse' ? _tfAnswers.containsKey(i) : _answers.containsKey(i);
              final isCurrent = i == _currentIndex;
              return GestureDetector(
                onTap: () => _goTo(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: isCurrent ? 24 : 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: isCurrent ? AppColors.primary : answered ? AppColors.success : AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(5),
                  ),
                ),
              );
            })),
          ),

          // ── Navigation buttons ─────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Row(children: [
              if (_currentIndex > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _goTo(_currentIndex - 1),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: const BorderSide(color: AppColors.border),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      minimumSize: const Size(0, 50),
                    ),
                    child: const Text('Previous'),
                  ),
                ),
              if (_currentIndex > 0) const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _currentIndex < questions.length - 1
                    ? ElevatedButton(
                        onPressed: () => _goTo(_currentIndex + 1),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          minimumSize: const Size(0, 50),
                        ),
                        child: const Text('Next', style: TextStyle(color: Colors.white)),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Material(color: Colors.transparent, child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: _submit,
                          child: Container(height: 50, alignment: Alignment.center,
                            child: const Text('Submit Quiz', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15))),
                        )),
                      ),
              ),
            ]),
          ),

          SafeArea(child: const SizedBox(height: 0)),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }
}

// ── Question page ─────────────────────────────────────
class _QuestionPage extends StatelessWidget {
  final Map<String, dynamic> question;
  final int questionIndex;
  final int? selectedMcq;
  final bool? selectedTf;
  final ValueChanged<int> onMcqSelect;
  final ValueChanged<bool> onTfSelect;

  const _QuestionPage({
    required this.question, required this.questionIndex,
    required this.selectedMcq, required this.selectedTf,
    required this.onMcqSelect, required this.onTfSelect,
  });

  @override
  Widget build(BuildContext context) {
    final type = question['type'] as String;
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 12),
        // Question text
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(_typeLabel(type), style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 12),
            Text(question['question'] as String,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(height: 1.5, fontSize: 15)),
            if (type == 'code') ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D1117),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  question['codeSnippet'] as String,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    color: Color(0xFF79C0FF),
                    fontSize: 13,
                    height: 1.6,
                  ),
                ),
              ),
            ],
          ]),
        ).animate().fadeIn(duration: 300.ms),

        const SizedBox(height: 16),

        // Answers
        if (type == 'truefalse') _TFOptions(selected: selectedTf, onSelect: onTfSelect)
        else _McqOptions(options: List<String>.from(question['options'] as List), selected: selectedMcq, onSelect: onMcqSelect),

        const SizedBox(height: 20),
      ]),
    );
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'truefalse': return 'TRUE / FALSE';
      case 'code': return 'CODE REVIEW';
      default: return 'MULTIPLE CHOICE';
    }
  }
}

class _McqOptions extends StatelessWidget {
  final List<String> options;
  final int? selected;
  final ValueChanged<int> onSelect;
  const _McqOptions({required this.options, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) => Column(children: options.asMap().entries.map((e) {
    final isSelected = selected == e.key;
    return GestureDetector(
      onTap: () => onSelect(e.key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.1) : AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(children: [
          Container(
            width: 26, height: 26,
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary : AppColors.surfaceVariant,
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(
              String.fromCharCode(65 + e.key),
              style: TextStyle(color: isSelected ? Colors.white : AppColors.textMuted,
                  fontWeight: FontWeight.w700, fontSize: 12),
            )),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(e.value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isSelected ? AppColors.primary : AppColors.textPrimary))),
        ]),
      ),
    );
  }).toList());
}

class _TFOptions extends StatelessWidget {
  final bool? selected;
  final ValueChanged<bool> onSelect;
  const _TFOptions({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) => Row(children: [
    Expanded(child: _TFBtn(label: 'True', icon: Icons.check_rounded, value: true, selected: selected, onSelect: onSelect, color: AppColors.success)),
    const SizedBox(width: 12),
    Expanded(child: _TFBtn(label: 'False', icon: Icons.close_rounded, value: false, selected: selected, onSelect: onSelect, color: AppColors.error)),
  ]);
}

class _TFBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool value, selected;
  final ValueChanged<bool> onSelect;
  final Color color;
  const _TFBtn({required this.label, required this.icon, required this.value, required this.selected, required this.onSelect, required this.color});

  bool get isSelected => selected == value;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => onSelect(value),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 80,
      decoration: BoxDecoration(
        color: isSelected ? color.withOpacity(0.12) : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isSelected ? color : AppColors.border, width: isSelected ? 2 : 1),
      ),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: isSelected ? color : AppColors.textMuted, size: 28),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: isSelected ? color : AppColors.textSecondary, fontWeight: FontWeight.w700)),
      ]),
    ),
  );
}

// ── Grading overlay ───────────────────────────────────
class _GradingOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
      const SizedBox(height: 24),
      Text('Grading your answers...', style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 8),
      Text('Hang tight while the AI checks your quiz', style: Theme.of(context).textTheme.bodyMedium),
    ]).animate().fadeIn(duration: 400.ms)),
  );
}
