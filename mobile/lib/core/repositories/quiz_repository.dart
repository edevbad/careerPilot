import 'package:dio/dio.dart';
import '../models/quiz_session_model.dart';
import '../models/retake_status_model.dart';
import '../network/api_client.dart';
import '../network/app_exception.dart';

class QuizRepository {
  final Dio _dio = ApiClient.instance.dio;

  Future<QuizSessionModel> getQuizSession(
    String roadmapId,
    int phaseNumber,
  ) async {
    try {
      final response = await _dio.get('/quizzes/$roadmapId/phase/$phaseNumber');
      return QuizSessionModel.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      String msg = 'Something went wrong';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String && data.isNotEmpty) {
        msg = 'Server error (${e.response?.statusCode})';
      }
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<QuizResultModel> submitQuiz(
    String roadmapId,
    int phaseNumber, {
    required String startedAt,
    required List<Map<String, dynamic>> answers,
  }) async {
    try {
      final response = await _dio.post(
        '/quizzes/$roadmapId/phase/$phaseNumber/submit',
        data: {
          'startedAt': startedAt,
          'answers': answers,
        },
      );
      return QuizResultModel.fromJson(
        response.data['data'] as Map<String, dynamic>? ?? response.data ?? {},
      );
    } on DioException catch (e) {
      String msg = 'Something went wrong';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String && data.isNotEmpty) {
        msg = 'Server error (${e.response?.statusCode})';
      }
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<QuizResultsResponse> getQuizResults(
    String roadmapId,
    int phaseNumber,
  ) async {
    try {
      final response =
          await _dio.get('/quizzes/$roadmapId/phase/$phaseNumber/results');
      return QuizResultsResponse.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      String msg = 'Something went wrong';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String && data.isNotEmpty) {
        msg = 'Server error (${e.response?.statusCode})';
      }
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<RetakeStatusModel> getRetakeStatus(
    String roadmapId,
    int phaseNumber,
  ) async {
    try {
      final response = await _dio
          .get('/quizzes/$roadmapId/phase/$phaseNumber/retake-status');
      return RetakeStatusModel.fromJson(
        response.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      String msg = 'Something went wrong';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (data is String && data.isNotEmpty) {
        msg = 'Server error (${e.response?.statusCode})';
      }
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }
}
