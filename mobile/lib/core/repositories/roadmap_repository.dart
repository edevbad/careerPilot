import 'package:dio/dio.dart';
import '../models/roadmap_model.dart';
import '../network/api_client.dart';
import '../network/app_exception.dart';

class RoadmapRepository {
  final Dio _dio = ApiClient.instance.dio;

  Future<List<RoadmapModel>> getRoadmaps() async {
    try {
      final response = await _dio.get('/roadmaps');
      final roadmapsData = response.data['data']['roadmaps'] as List<dynamic>;
      return roadmapsData
          .map((r) => RoadmapModel.fromJson(r as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to load roadmaps';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<RoadmapModel> getRoadmap(String id) async {
    try {
      final response = await _dio.get('/roadmaps/$id');
      return RoadmapModel.fromJson(
        response.data['data']['roadmap'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to load roadmap';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<RoadmapModel> generateRoadmap({
    required String targetCareer,
    required String skillLevel,
    required String duration,
    required String interests,
    required String startDate,
  }) async {
    try {
      final response = await _dio.post('/roadmaps/generate', data: {
        'targetCareer': targetCareer,
        'skillLevel': skillLevel,
        'duration': duration,
        'interests': interests,
        'startDate': startDate,
      });
      return RoadmapModel.fromJson(
        response.data['data']['roadmap'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Generation failed';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<RoadmapModel> regenerateRoadmap(
    String id, {
    String? feedback,
  }) async {
    try {
      final response = await _dio.post(
        '/roadmaps/$id/regenerate',
        data: feedback != null ? {'feedback': feedback} : null,
      );
      return RoadmapModel.fromJson(
        response.data['data']['roadmap'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Regeneration failed';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<RoadmapModel> updateRoadmap(
    String id,
    Map<String, dynamic> updates,
  ) async {
    try {
      final response = await _dio.put('/roadmaps/$id', data: updates);
      return RoadmapModel.fromJson(
        response.data['data']['roadmap'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Update failed';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<void> deleteRoadmap(String id) async {
    try {
      await _dio.delete('/roadmaps/$id');
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Deletion failed';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<RoadmapModel> updateSkillProgress(
    String id, {
    required int phaseIndex,
    required int skillIndex,
    required bool completed,
  }) async {
    try {
      final response = await _dio.patch('/roadmaps/$id/skill-progress', data: {
        'phaseIndex': phaseIndex,
        'skillIndex': skillIndex,
        'completed': completed,
      });
      return RoadmapModel.fromJson(
        response.data['data']['roadmap'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to update skill progress';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<RoadmapModel> updateTaskProgress(
    String id, {
    required int phaseIndex,
    required int skillIndex,
    required int taskIndex,
    required bool completed,
  }) async {
    try {
      final response = await _dio.patch('/roadmaps/$id/task-progress', data: {
        'phaseIndex': phaseIndex,
        'skillIndex': skillIndex,
        'taskIndex': taskIndex,
        'completed': completed,
      });
      return RoadmapModel.fromJson(
        response.data['data']['roadmap'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to update task progress';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }
}
