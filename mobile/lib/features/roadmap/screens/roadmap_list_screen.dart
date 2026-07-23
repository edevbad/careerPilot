import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/repositories/roadmap_repository.dart';
import '../../../core/models/roadmap_model.dart';

class RoadmapListScreen extends StatefulWidget {
  const RoadmapListScreen({super.key});

  @override
  State<RoadmapListScreen> createState() => _RoadmapListScreenState();
}

class _RoadmapListScreenState extends State<RoadmapListScreen> {
  final _roadmapRepository = RoadmapRepository();
  bool _isLoading = true;
  String? _error;
  List<RoadmapModel> _roadmaps = [];

  @override
  void initState() {
    super.initState();
    _loadRoadmaps();
  }

  Future<void> _loadRoadmaps() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final list = await _roadmapRepository.getRoadmaps();
      if (mounted) {
        setState(() {
          _roadmaps = list;
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
        title: const Text('My Roadmaps'),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.search_rounded),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await context.push('/roadmap/generate');
          if (result == true) {
            _loadRoadmaps();
          }
        },
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('New Roadmap', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!, style: Theme.of(context).textTheme.bodyMedium),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _loadRoadmaps,
                        child: const Text('Retry'),
                      )
                    ],
                  ),
                )
              : _roadmaps.isEmpty
                  ? const _EmptyState()
                  : RefreshIndicator(
                      onRefresh: _loadRoadmaps,
                      color: AppColors.primary,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                        itemCount: _roadmaps.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, i) => _RoadmapCard(
                          roadmap: _roadmaps[i],
                          index: i,
                        ),
                      ),
                    ),
    );
  }
}

class _RoadmapCard extends StatelessWidget {
  final RoadmapModel roadmap;
  final int index;
  const _RoadmapCard({required this.roadmap, required this.index});

  Color _statusColor(String status) {
    switch (status) {
      case 'active': return AppColors.success;
      case 'paused': return AppColors.warning;
      case 'completed': return AppColors.primary;
      default: return AppColors.textMuted;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'active': return Icons.play_circle_rounded;
      case 'paused': return Icons.pause_circle_rounded;
      case 'completed': return Icons.check_circle_rounded;
      default: return Icons.circle_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = roadmap.status;
    final completion = roadmap.overallCompletion;
    final statusColor = _statusColor(status);

    return GestureDetector(
      onTap: () => context.push('/roadmap/${roadmap.id}'),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: status == 'active' ? AppColors.primary.withOpacity(0.4) : AppColors.border,
            width: status == 'active' ? 1.5 : 1,
          ),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(children: [
                Icon(_statusIcon(status), color: statusColor, size: 14),
                const SizedBox(width: 5),
                Text(status[0].toUpperCase() + status.substring(1),
                    style: TextStyle(color: statusColor, fontWeight: FontWeight.w600, fontSize: 12)),
              ]),
            ),
            const Spacer(),
            Text('${roadmap.totalPhases} phases',
                style: Theme.of(context).textTheme.bodySmall),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: Text(roadmap.targetCareer,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontSize: 17)),
            ),
            const SizedBox(width: 12),
            // Circular %
            SizedBox(
              width: 48, height: 48,
              child: Stack(alignment: Alignment.center, children: [
                CircularProgressIndicator(
                  value: completion,
                  backgroundColor: AppColors.surfaceVariant,
                  valueColor: AlwaysStoppedAnimation(statusColor),
                  strokeWidth: 4,
                ),
                Text('${(completion * 100).toInt()}%',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              ]),
            ),
          ]),
          const SizedBox(height: 6),
          Text('Started ${roadmap.startDate ?? ""} · Est. end ${roadmap.estimatedEnd ?? ""}',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: completion,
              backgroundColor: AppColors.surfaceVariant,
              valueColor: AlwaysStoppedAnimation(statusColor),
              minHeight: 5,
            ),
          ),
          const SizedBox(height: 14),
          Row(children: [
            const Icon(Icons.layers_rounded, size: 14, color: AppColors.textMuted),
            const SizedBox(width: 5),
            Text('Phase ${roadmap.activePhaseNumber} of ${roadmap.totalPhases} active',
                style: Theme.of(context).textTheme.bodySmall),
            const Spacer(),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
          ]),
        ]),
      ).animate().fadeIn(duration: 400.ms, delay: Duration(milliseconds: index * 80)).slideY(begin: 0.15, end: 0),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    const Icon(Icons.map_outlined, size: 64, color: AppColors.textMuted),
    const SizedBox(height: 16),
    Text('No roadmaps yet', style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: AppColors.textMuted)),
    const SizedBox(height: 8),
    Text('Generate your first AI roadmap to get started',
        style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
  ]));
}
