import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/auth/screens/forgot_password_screen.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/roadmap/screens/roadmap_list_screen.dart';
import '../features/roadmap/screens/roadmap_detail_screen.dart';
import '../features/roadmap/screens/generate_roadmap_screen.dart';
import '../features/tasks/screens/tasks_screen.dart';
import '../features/quiz/screens/quiz_hub_screen.dart';
import '../features/quiz/screens/active_quiz_screen.dart';
import '../features/quiz/screens/quiz_results_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../core/models/quiz_session_model.dart';
// import '../features/resources/screens/resource_browse_screen.dart';
// import '../features/resources/screens/resource_detail_screen.dart';
import 'main_shell.dart';

final GoRouter router = GoRouter(
  initialLocation: '/splash',
  routes: [
    // ── Auth routes (no bottom nav) ─────────────────
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),

    // ── Main tabbed shell ────────────────────────────
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => MainShell(navigationShell: shell),
      branches: [
        // Branch 0 — Dashboard
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/dashboard',
              builder: (context, state) => const DashboardScreen(),
            ),
          ],
        ),

        // Branch 1 — Roadmap (with nested routes)
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/roadmap',
              builder: (context, state) => const RoadmapListScreen(),
              routes: [
                GoRoute(
                  path: 'generate',
                  builder: (context, state) => const GenerateRoadmapScreen(),
                ),
                GoRoute(
                  path: ':id',
                  builder: (context, state) => RoadmapDetailScreen(
                    roadmapId: state.pathParameters['id']!,
                  ),
                ),
              ],
            ),
          ],
        ),

        // Branch 2 — Tasks
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/tasks',
              builder: (context, state) => const TasksScreen(),
            ),
            GoRoute(
              path: '/roadmaps/:roadmapId/tasks/:phaseNumber',
              builder: (context, state) {
                final roadmapId = state.pathParameters['roadmapId'];
                return TasksScreen(initialRoadmapId: roadmapId);
              },
            ),
          ],
        ),

        // Branch 3 — Quiz
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/quiz',
              builder: (context, state) => const QuizHubScreen(),
              routes: [
                GoRoute(
                  path: 'results',
                  builder: (context, state) {
                    final extra = state.extra as Map<String, dynamic>?;
                    final result = extra?['result'] as QuizResultModel?;
                    if (result != null) {
                      return QuizResultsScreen(result: result);
                    }
                    // Fallback for direct navigation without result
                    return QuizResultsScreen(
                      result: QuizResultModel(
                        passed: extra?['passed'] as bool? ?? false,
                        score: extra?['score'] as int? ?? 0,
                        correctAnswers: 0,
                        totalQuestions: 0,
                        passingScore: 70,
                        nextPhaseUnlocked: false,
                        activePhaseNumber: 1,
                        durationFormatted: '',
                        studySuggestions: [],
                      ),
                    );
                  },
                ),
                GoRoute(
                  path: ':roadmapId/:phaseNumber',
                  builder: (context, state) => ActiveQuizScreen(
                    roadmapId: state.pathParameters['roadmapId']!,
                    phaseNumber: int.tryParse(
                            state.pathParameters['phaseNumber'] ?? '1') ??
                        1,
                  ),
                ),
              ],
            ),
          ],
        ),

        // Branch 4 — Profile
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
