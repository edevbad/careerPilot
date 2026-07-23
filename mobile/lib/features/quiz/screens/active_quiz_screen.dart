import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/repositories/quiz_repository.dart';
import '../../../core/models/quiz_session_model.dart';

class ActiveQuizScreen extends StatefulWidget {
  final String roadmapId;
  final int phaseNumber;
  const ActiveQuizScreen({
    super.key,
    required this.roadmapId,
    required this.phaseNumber,
  });

  @override
  State<ActiveQuizScreen> createState() => _ActiveQuizScreenState();
}

class _ActiveQuizScreenState extends State<ActiveQuizScreen> {
  final _quizRepo = QuizRepository();
  final PageController _pageCtrl = PageController();

  // Loading / error state
  bool _isLoading = true;
  String? _loadError;
  QuizSessionModel? _session;

  // Answer tracking
  int _currentIndex = 0;
  // For MCQ: questionId → selected option string (e.g. "A", "B", "C", "D")
  final Map<int, String> _mcqAnswers = {};
  // For True/False: questionId → "True" | "False"
  final Map<int, String> _tfAnswers = {};

  bool _submitting = false;

  List<QuizQuestionModel> get _questions => _session?.questions ?? [];

  bool _isAnswered(QuizQuestionModel q) {
    return q.isTrueFalse ? _tfAnswers.containsKey(q.id) : _mcqAnswers.containsKey(q.id);
  }

  int get _answeredCount => _questions.where((q) => _isAnswered(q)).length;

  @override
  void initState() {
    super.initState();
    _loadQuiz();
  }

  Future<void> _loadQuiz() async {
    setState(() {
      _isLoading = true;
      _loadError = null;
    });
    try {
      final session = await _quizRepo.getQuizSession(widget.roadmapId, widget.phaseNumber);
      if (mounted) {
        setState(() {
          _session = session;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadError = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _goTo(int i) {
    _pageCtrl.animateToPage(i,
        duration: const Duration(milliseconds: 350), curve: Curves.easeInOut);
    setState(() => _currentIndex = i);
  }

  Future<void> _submit() async {
    final unanswered = _questions.length - _answeredCount;
    if (unanswered > 0) {
      final confirm = await showDialog<bool>(
        context: context,
        useRootNavigator: true,
        builder: (dialogContext) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Submit Quiz?', style: TextStyle(color: AppColors.textPrimary)),
          content: Text(
              '$unanswered question${unanswered > 1 ? 's' : ''} unanswered. Submit anyway?',
              style: const TextStyle(color: AppColors.textSecondary)),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Review')),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Submit', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      if (confirm != true) return;
    }

    setState(() => _submitting = true);

    try {
      // Build answers payload for the API
      // The API expects: { questionId, userAnswer, questionType, _correctAnswer, _explanation, _topic, questionText }
      // The server already knows correct answers — we just need to send what the user selected.
      // _correctAnswer, _explanation, _topic are provided back by server from the original question set.
      // We just pass empty strings for those fields since the server has them.
      final answers = _questions.map((q) {
        String userAnswer;
        if (q.isTrueFalse) {
          userAnswer = _tfAnswers[q.id] ?? '';
        } else {
          userAnswer = _mcqAnswers[q.id] ?? '';
        }
        return {
          'questionId': q.id,
          'userAnswer': userAnswer,
          'questionType': q.questionType,
          'questionText': q.questionText,
          '_correctAnswer': '',   // server fills this in
          '_explanation': '',     // server fills this in
          '_topic': '',           // server fills this in
        };
      }).toList();

      final result = await _quizRepo.submitQuiz(
        widget.roadmapId,
        widget.phaseNumber,
        startedAt: _session!.startedAt,
        answers: answers,
      );

      if (mounted) {
        context.go('/quiz/results', extra: {'result': result});
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Submission failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
              SizedBox(height: 24),
              Text('Loading quiz questions...',
                  style: TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ),
      );
    }

    if (_loadError != null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.close_rounded),
        )),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text('Failed to load quiz', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(_loadError!, style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _loadQuiz,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              ),
            ]),
          ),
        ),
      );
    }

    if (_submitting) return _GradingOverlay();

    final q = _questions[_currentIndex];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: Container(
            width: 34, height: 34,
            decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.close_rounded, size: 18, color: AppColors.textPrimary),
          ),
        ),
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(
            _session?.phaseTitle ?? 'Phase ${widget.phaseNumber} Quiz',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14),
          ),
          Text(
            'Question ${_currentIndex + 1} of ${_questions.length}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ]),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: _questions.isEmpty ? 0 : (_currentIndex + 1) / _questions.length,
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
              itemCount: _questions.length,
              itemBuilder: (_, i) {
                final question = _questions[i];
                return _QuestionPage(
                  question: question,
                  selectedMcq: _mcqAnswers[question.id],
                  selectedTf: _tfAnswers[question.id],
                  onMcqSelect: (opt) => setState(() => _mcqAnswers[question.id] = opt),
                  onTfSelect: (val) => setState(() => _tfAnswers[question.id] = val),
                );
              },
            ),
          ),

          // ── Dot navigation ────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_questions.length, (i) {
                final answered = _isAnswered(_questions[i]);
                final isCurrent = i == _currentIndex;
                return GestureDetector(
                  onTap: () => _goTo(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: isCurrent ? 24 : 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? AppColors.primary
                          : answered
                              ? AppColors.success
                              : AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                );
              }),
            ),
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
                      shape:
                          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      minimumSize: const Size(0, 50),
                    ),
                    child: const Text('Previous'),
                  ),
                ),
              if (_currentIndex > 0) const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _currentIndex < _questions.length - 1
                    ? ElevatedButton(
                        onPressed: () => _goTo(_currentIndex + 1),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          minimumSize: const Size(0, 50),
                        ),
                        child: const Text('Next', style: TextStyle(color: Colors.white)),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: _submit,
                            child: Container(
                              height: 50,
                              alignment: Alignment.center,
                              child: const Text('Submit Quiz',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15)),
                            ),
                          ),
                        ),
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
  final QuizQuestionModel question;
  final String? selectedMcq;
  final String? selectedTf;
  final ValueChanged<String> onMcqSelect;
  final ValueChanged<String> onTfSelect;

  const _QuestionPage({
    required this.question,
    required this.selectedMcq,
    required this.selectedTf,
    required this.onMcqSelect,
    required this.onTfSelect,
  });

  @override
  Widget build(BuildContext context) {
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
              child: Text(
                question.isTrueFalse ? 'TRUE / FALSE' : 'MULTIPLE CHOICE',
                style: const TextStyle(
                    color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              question.questionText,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(height: 1.5, fontSize: 15),
            ),
          ]),
        ).animate().fadeIn(duration: 300.ms),

        const SizedBox(height: 16),

        // Answers
        if (question.isTrueFalse)
          _TFOptions(selected: selectedTf, onSelect: onTfSelect)
        else
          _McqOptions(
              options: question.options,
              selected: selectedMcq,
              onSelect: onMcqSelect),

        const SizedBox(height: 20),
      ]),
    );
  }
}

class _McqOptions extends StatelessWidget {
  final Map<String,String> options;
  final String? selected;
  final ValueChanged<String> onSelect;
  const _McqOptions({required this.options, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) => Column(
        children: options.entries.map((e) {
          // The API returns option strings like "A", "B", "C", "D" — we use them directly
          final optionKey = e.key; // A, B, C, D
          final optionLabel = e.value;
          final isSelected = selected == optionKey;
          return GestureDetector(
            onTap: () => onSelect(optionKey),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color:
                    isSelected ? AppColors.primary.withOpacity(0.1) : AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.border,
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Row(children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : AppColors.surfaceVariant,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      optionKey,
                      style: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textMuted,
                          fontWeight: FontWeight.w700,
                          fontSize: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    optionLabel,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: isSelected ? AppColors.primary : AppColors.textPrimary),
                  ),
                ),
              ]),
            ),
          );
        }).toList(),
      );
}

class _TFOptions extends StatelessWidget {
  final String? selected;
  final ValueChanged<String> onSelect;
  const _TFOptions({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(
            child: _TFBtn(
                label: 'True',
                icon: Icons.check_rounded,
                value: 'True',
                selected: selected,
                onSelect: onSelect,
                color: AppColors.success)),
        const SizedBox(width: 12),
        Expanded(
            child: _TFBtn(
                label: 'False',
                icon: Icons.close_rounded,
                value: 'False',
                selected: selected,
                onSelect: onSelect,
                color: AppColors.error)),
      ]);
}

class _TFBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final String value;
  final String? selected;
  final ValueChanged<String> onSelect;
  final Color color;
  const _TFBtn(
      {required this.label,
      required this.icon,
      required this.value,
      required this.selected,
      required this.onSelect,
      required this.color});

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
            border: Border.all(
                color: isSelected ? color : AppColors.border,
                width: isSelected ? 2 : 1),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, color: isSelected ? color : AppColors.textMuted, size: 28),
            const SizedBox(height: 4),
            Text(label,
                style: TextStyle(
                    color: isSelected ? color : AppColors.textSecondary,
                    fontWeight: FontWeight.w700)),
          ]),
        ),
      );
}

// ── Grading overlay ───────────────────────────────────
class _GradingOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
              const SizedBox(height: 24),
              Text('Grading your answers...',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text('Hang tight while the AI checks your quiz',
                  style: Theme.of(context).textTheme.bodyMedium),
            ],
          ).animate().fadeIn(duration: 400.ms),
        ),
      );
}
