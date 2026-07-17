import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app/router.dart';
import 'app/theme.dart';

import 'core/network/api_client.dart';
import 'core/auth/auth_controller.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0F1629),
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  
  // Initialize APIs
  await ApiClient.instance.init();
  await AuthController.instance.initialize();
  
  runApp(const CareerPilotApp());
}

class CareerPilotApp extends StatelessWidget {
  const CareerPilotApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'CareerPilot',
      theme: AppTheme.dark(),
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
