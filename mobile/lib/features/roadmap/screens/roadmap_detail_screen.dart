import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/repositories/roadmap_repository.dart';
import '../../../core/models/roadmap_model.dart';

class RoadmapDetailScreen extends StatefulWidget {
  final String roadmapId;
  const RoadmapDetailScreen({super.key, required this.roadmapId});

  @override
  State<RoadmapDetailScreen> createState() => _RoadmapDetailScreenState();
}

class _RoadmapDetailScreenState extends State<RoadmapDetailScreen> {
  final _roadmapRepository = RoadmapRepository();
  RoadmapModel? _roadmap;
  bool _isLoading = true;
  String? _error;
  Set<int> expandedPhases = {};

  @override
  void initState() {
    super.initState();
    _loadRoadmap();
  }

  Future<void> _loadRoadmap() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final rm = await _roadmapRepository.getRoadmap(widget.roadmapId);
      if (mounted) {
        setState(() {
          _roadmap = rm;
          _isLoading = false;
          expandedPhases = {rm.activePhaseNumber};
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

  Future<void> _toggleResourceBookmark(
      int phaseNumber, String resourceUrl, bool nextVal) async {
    final prevRoadmap = _roadmap;
    if (prevRoadmap == null) return;

    setState(() {
      _roadmap = _updateResourceLocally(
        prevRoadmap,
        phaseNumber,
        resourceUrl,
        isBookmarked: nextVal,
      );
    });

    try {
      final updated = await _roadmapRepository.toggleResourceBookmark(
        widget.roadmapId,
        phaseNumber: phaseNumber,
        resourceUrl: resourceUrl,
      );
      if (mounted) {
        setState(() => _roadmap = updated);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _roadmap = prevRoadmap);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed to update bookmark: $e'),
              backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _toggleResourceComplete(
      int phaseNumber, String resourceUrl, bool nextVal) async {
    final prevRoadmap = _roadmap;
    if (prevRoadmap == null) return;

    setState(() {
      _roadmap = _updateResourceLocally(
        prevRoadmap,
        phaseNumber,
        resourceUrl,
        isCompleted: nextVal,
      );
    });

    try {
      final updated = await _roadmapRepository.markResourceComplete(
        widget.roadmapId,
        phaseNumber: phaseNumber,
        resourceUrl: resourceUrl,
      );
      if (mounted) {
        setState(() => _roadmap = updated);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _roadmap = prevRoadmap);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed to update resource: $e'),
              backgroundColor: AppColors.error),
        );
      }
    }
  }

  RoadmapModel _updateResourceLocally(
    RoadmapModel roadmap,
    int phaseNumber,
    String resourceUrl, {
    bool? isBookmarked,
    bool? isCompleted,
  }) {
    final newPhases = roadmap.phases.map((p) {
      if (p.number != phaseNumber) return p;
      final newResources = p.resources.map((r) {
        if (r.url != resourceUrl) return r;
        return r.copyWith(isBookmarked: isBookmarked, isCompleted: isCompleted);
      }).toList();
      return p.copyWith(resources: newResources);
    }).toList();
    return roadmap.copyWith(phases: newPhases);
  }

  Future<void> _handleMenuAction(String action) async {
    if (action == 'delete') {
      final confirm = await showDialog<bool>(
        context: context,
        useRootNavigator: true,
        builder: (dialogContext) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Delete Roadmap?',
              style: TextStyle(color: AppColors.textPrimary)),
          content: const Text(
              'Are you sure you want to delete this roadmap? This action cannot be undone.',
              style: TextStyle(color: AppColors.textSecondary)),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
              child:
                  const Text('Delete', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      if (confirm == true) {
        try {
          await _roadmapRepository.deleteRoadmap(widget.roadmapId);
          if (mounted) {
            context.pop(true);
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text('Delete failed: $e'),
                  backgroundColor: AppColors.error),
            );
          }
        }
      }
    } else if (action == 'regenerate') {
      final feedbackCtrl = TextEditingController();
      final confirm = await showDialog<bool>(
        context: context,
        useRootNavigator: true,
        builder: (dialogContext) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Regenerate Roadmap',
              style: TextStyle(color: AppColors.textPrimary)),
          content: TextField(
            controller: feedbackCtrl,
            decoration: const InputDecoration(
              hintText: 'e.g. Make it more focused on React basics',
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style:
                  ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Regenerate',
                  style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      if (confirm == true) {
        setState(() => _isLoading = true);
        try {
          final updated = await _roadmapRepository.regenerateRoadmap(
            widget.roadmapId,
            feedback: feedbackCtrl.text.trim().isNotEmpty
                ? feedbackCtrl.text.trim()
                : null,
          );
          if (mounted) {
            setState(() {
              _roadmap = updated;
              _isLoading = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Roadmap regenerated successfully!'),
                  backgroundColor: AppColors.success),
            );
          }
        } catch (e) {
          if (mounted) {
            setState(() => _isLoading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text('Regeneration failed: $e'),
                  backgroundColor: AppColors.error),
            );
          }
        }
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

    if (_error != null || _roadmap == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error ?? 'Roadmap not found',
                  style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _loadRoadmap,
                child: const Text('Retry'),
              )
            ],
          ),
        ),
      );
    }

    final roadmap = _roadmap!;
    final phases = roadmap.phases;
    final completion = roadmap.overallCompletion;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 190,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.background,
            leading: IconButton(
              onPressed: () => context.pop(),
              icon: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.arrow_back_ios_new_rounded,
                    size: 16, color: AppColors.textPrimary),
              ),
            ),
            actions: [
              PopupMenuButton<String>(
                color: AppColors.surfaceVariant,
                icon: const Icon(Icons.more_vert_rounded,
                    color: AppColors.textPrimary),
                onSelected: _handleMenuAction,
                itemBuilder: (_) => [
                  const PopupMenuItem(
                      value: 'regenerate',
                      child: Text('Regenerate',
                          style: TextStyle(color: AppColors.textPrimary))),
                  const PopupMenuItem(
                      value: 'delete',
                      child: Text('Delete',
                          style: TextStyle(color: AppColors.error))),
                ],
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                padding: const EdgeInsets.fromLTRB(20, 90, 20, 16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0D1425), Color(0xFF080C18)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Row(children: [
                      Expanded(
                        child: Text(roadmap.targetCareer,
                            style: Theme.of(context).textTheme.headlineMedium),
                      ),
                      SizedBox(
                        width: 64,
                        height: 64,
                        child: Stack(alignment: Alignment.center, children: [
                          CircularProgressIndicator(
                            value: completion,
                            backgroundColor: AppColors.surfaceVariant,
                            valueColor:
                                const AlwaysStoppedAnimation(AppColors.primary),
                            strokeWidth: 5,
                          ),
                          Text('${(completion * 100).toInt()}%',
                              style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13)),
                        ]),
                      ),
                    ]),
                    const SizedBox(height: 8),
                    Row(children: [
                      _StatusBadge(roadmap.status),
                      const SizedBox(width: 8),
                      Text(
                          '${phases.length} phases · Started ${roadmap.startDate ?? ""}',
                          style: Theme.of(context).textTheme.bodySmall),
                    ]),
                  ],
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  if (i == phases.length) return const SizedBox(height: 40);
                  final phase = phases[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _PhaseCard(
                      roadmapId: roadmap.id,
                      phaseIndex: i,
                      phase: phase,
                      isExpanded: expandedPhases.contains(phase.number),
                      onToggle: () => setState(() {
                        final n = phase.number;
                        if (expandedPhases.contains(n)) {
                          expandedPhases.remove(n);
                        } else {
                          expandedPhases.add(n);
                        }
                      }),
                      onResourceBookmarkToggle: (url, nextVal) =>
                          _toggleResourceBookmark(phase.number, url, nextVal),
                      onResourceCompleteToggle: (url, nextVal) =>
                          _toggleResourceComplete(phase.number, url, nextVal),
                    ),
                  );
                },
                childCount: phases.length + 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResourceTile extends StatelessWidget {
  final ResourceModel resource;
  final VoidCallback onBookmarkToggle;
  final VoidCallback onCompleteToggle;

  const _ResourceTile({
    required this.resource,
    required this.onBookmarkToggle,
    required this.onCompleteToggle,
  });

  IconData get _typeIcon {
    switch (resource.type) {
      case 'video':
        return Icons.play_circle_outline_rounded;
      case 'course':
        return Icons.school_outlined;
      case 'documentation':
        return Icons.description_outlined;
      default:
        return Icons.article_outlined;
    }
  }

  Future<void> _openResource(BuildContext context) async {
    final uri = Uri.tryParse(resource.url);
    if (uri == null) return;
    final canOpen = await canLaunchUrl(uri);
    if (canOpen) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open ${resource.url}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () => _openResource(context),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(children: [
              Icon(_typeIcon, size: 18, color: AppColors.info),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(resource.title,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: resource.isCompleted
                                  ? AppColors.textMuted
                                  : AppColors.textPrimary,
                              decoration: resource.isCompleted
                                  ? TextDecoration.lineThrough
                                  : null,
                              fontWeight: FontWeight.w600,
                            )),
                    if (resource.platform.isNotEmpty)
                      Text(resource.platform,
                          style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              IconButton(
                onPressed: onBookmarkToggle,
                icon: Icon(
                  resource.isBookmarked
                      ? Icons.bookmark_rounded
                      : Icons.bookmark_border_rounded,
                  size: 18,
                  color: resource.isBookmarked
                      ? AppColors.primary
                      : AppColors.textMuted,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: onCompleteToggle,
                icon: Icon(
                  resource.isCompleted
                      ? Icons.check_circle_rounded
                      : Icons.check_circle_outline_rounded,
                  size: 18,
                  color: resource.isCompleted
                      ? AppColors.success
                      : AppColors.textMuted,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
class _PhaseCard extends StatelessWidget {
  final String roadmapId;
  final int phaseIndex;
  final PhaseModel phase;
  final bool isExpanded;
  final VoidCallback onToggle;
  final void Function(String resourceUrl, bool nextVal)
      onResourceBookmarkToggle;
  final void Function(String resourceUrl, bool nextVal)
      onResourceCompleteToggle;

  const _PhaseCard({
    required this.roadmapId,
    required this.phaseIndex,
    required this.phase,
    required this.isExpanded,
    required this.onToggle,
    required this.onResourceBookmarkToggle,
    required this.onResourceCompleteToggle,
  });

  @override
  Widget build(BuildContext context) {
    final status = phase.status;
    final isLocked = status == 'locked';
    final isCompleted = status == 'completed';
    final isActive = status == 'active';
    final subtopics = phase.subtopics;

    Color borderColor = AppColors.border;
    if (isActive) borderColor = AppColors.primary;
    if (isCompleted) borderColor = AppColors.success.withOpacity(0.4);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(
        color:
            isLocked ? AppColors.surface.withOpacity(0.5) : AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor, width: isActive ? 1.5 : 1),
      ),
      child: Column(children: [
        InkWell(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
          onTap: isLocked ? null : onToggle,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isLocked
                      ? AppColors.surfaceVariant
                      : isCompleted
                          ? AppColors.success.withOpacity(0.15)
                          : AppColors.primary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check_rounded,
                          color: AppColors.success, size: 20)
                      : isLocked
                          ? const Icon(Icons.lock_rounded,
                              color: AppColors.textMuted, size: 18)
                          : Text('${phase.number}',
                              style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(phase.title,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                                color: isLocked
                                    ? AppColors.textMuted
                                    : AppColors.textPrimary,
                                fontWeight: FontWeight.w600)),
                    const SizedBox(height: 3),
                    Row(children: [
                      _DiffBadge(phase.difficulty),
                      const SizedBox(width: 6),
                      Text('~${phase.estimatedWeeks} weeks',
                          style: Theme.of(context).textTheme.bodySmall),
                      if (isCompleted && phase.quizScore != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text('${phase.quizScore}% quiz',
                              style: const TextStyle(
                                  color: AppColors.success,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ]),
                  ])),
              if (!isLocked)
                Icon(
                  isExpanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: AppColors.textMuted,
                ),
            ]),
          ),
        ),
        if (isExpanded && !isLocked) ...[
          const Divider(height: 1, color: AppColors.border),
          Padding(
            padding: const EdgeInsets.all(16),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (phase.summary != null)
                Text(phase.summary!,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(height: 1.55)),
              const SizedBox(height: 16),
              Text('Sub-topics',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontSize: 13)),
              const SizedBox(height: 8),
              ...(subtopics.map((s) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.circle,
                              size: 6, color: AppColors.primary),
                          const SizedBox(width: 10),
                          Expanded(
                              child: RichText(
                                  text: TextSpan(
                            text: '${s['title']}: ',
                            style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13),
                            children: [
                              TextSpan(
                                  text: s['description'] as String? ?? '',
                                  style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w400))
                            ],
                          ))),
                        ]),
                  ))),
              const SizedBox(height: 16),
              if (phase.resources.isNotEmpty) ...[
                Text('Resources',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontSize: 13)),
                const SizedBox(height: 8),
                ...phase.resources.map((r) => _ResourceTile(
                      resource: r,
                      onBookmarkToggle: () =>
                          onResourceBookmarkToggle(r.url, !r.isBookmarked),
                      onCompleteToggle: () =>
                          onResourceCompleteToggle(r.url, !r.isCompleted),
                    )),
                const SizedBox(height: 16),
              ],
              if (isActive)
                Column(children: [
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => context.push(
                        '/roadmaps/$roadmapId/tasks/${phase.number}',
                      ),
                      icon: const Icon(Icons.checklist_rounded, size: 16),
                      label: const Text("Today's Tasks"),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.info,
                        side: const BorderSide(color: AppColors.info),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () =>
                          context.push('/quiz/$roadmapId/${phase.number}'),
                      icon: const Icon(Icons.quiz_rounded,
                          size: 16, color: Colors.white),
                      label: const Text('Take Quiz',
                          style: TextStyle(color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ]),
              if (isLocked || !isActive)
                Center(
                  child: Text(
                      '🔒 Pass Phase ${phase.number - 1} quiz to unlock',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppColors.textMuted)),
                ),
            ]),
          ),
        ],
      ]),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0);
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge(this.status);
  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'active':
        color = AppColors.success;
        break;
      case 'paused':
        color = AppColors.warning;
        break;
      default:
        color = AppColors.primary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(6)),
      child: Text(status[0].toUpperCase() + status.substring(1),
          style: TextStyle(
              color: color, fontWeight: FontWeight.w600, fontSize: 11)),
    );
  }
}

class _DiffBadge extends StatelessWidget {
  final String difficulty;
  const _DiffBadge(this.difficulty);
  @override
  Widget build(BuildContext context) {
    Color color;
    switch (difficulty) {
      case 'Beginner':
        color = AppColors.success;
        break;
      case 'Advanced':
        color = AppColors.error;
        break;
      default:
        color = AppColors.xpGold;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(5)),
      child: Text(difficulty,
          style: TextStyle(
              color: color, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}