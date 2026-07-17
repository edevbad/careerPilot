import 'package:dio/dio.dart';
import '../models/progress_summary_model.dart';
import '../network/api_client.dart';
import '../network/app_exception.dart';

class ProgressRepository {
  final Dio _dio = ApiClient.instance.dio;

  Future<ProgressSummaryModel> getSummary() async {
    try {
      final response = await _dio.get('/progress/summary');
      return ProgressSummaryModel.fromJson(
        response.data['data']['summary'] as Map<String, dynamic>? ?? {},
      );
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Failed to load progress summary';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }

  Future<void> syncProgress(String roadmapId) async {
    try {
      await _dio.post('/progress/sync/$roadmapId');
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Progress sync failed';
      throw ApiException(e.response?.statusCode ?? 500, msg);
    } catch (e) {
      throw parseException(e);
    }
  }
}
