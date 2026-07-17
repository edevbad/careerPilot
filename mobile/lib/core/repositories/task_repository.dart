import 'package:dio/dio.dart';
import '../models/task_model.dart';
import '../models/task_history_model.dart';
import '../network/api_client.dart';
import '../network/app_exception.dart';

class TaskRepository {
  final Dio _dio = ApiClient.instance.dio;

  Future<({List<TaskModel> tasks, TaskSummaryModel summary})> getTodaysTasks({
    String? roadmapId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (roadmapId != null) {
        queryParams['roadmapId'] = roadmapId;
      }
      final response = await _dio.get('/tasks/today', queryParameters: queryParams);
      final tasksData = response.data['data']['tasks'] as List<dynamic>? ?? [];
      final tasks = tasksData
          .map((t) => TaskModel.fromJson(t as Map<String, dynamic>))
          .toList();
      final summary = TaskSummaryModel.fromJson(
        response.data['data']['summary'] as Map<String, dynamic>? ?? {},
      );
      return (tasks: tasks, summary: summary);
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to load today\'s tasks';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<({TaskModel task, int xpEarned, int streak})> completeTask(String id) async {
    try {
      final response = await _dio.patch('/tasks/$id/complete');
      final task = TaskModel.fromJson(
        response.data['data']['task'] as Map<String, dynamic>,
      );
      final xpEarned = response.data['data']['xpEarned'] as int? ?? 0;
      final streak = response.data['data']['streak'] as int? ?? 0;
      return (task: task, xpEarned: xpEarned, streak: streak);
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to complete task';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<TaskModel> skipTask(String id, String reason) async {
    try {
      final response = await _dio.patch('/tasks/$id/skip', data: {
        'reason': reason,
      });
      return TaskModel.fromJson(
        response.data['data']['task'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to skip task';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<List<TaskHistoryModel>> getTaskHistory({
    required String startDate,
    required String endDate,
  }) async {
    try {
      final response = await _dio.get('/tasks/history', queryParameters: {
        'startDate': startDate,
        'endDate': endDate,
      });
      final historyData = response.data['data']['history'] as List<dynamic>? ?? [];
      return historyData
          .map((h) => TaskHistoryModel.fromJson(h as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to load task history';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }
}
