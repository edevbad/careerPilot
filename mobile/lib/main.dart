import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app/router.dart';
import 'app/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0F1629),
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const CareerPilotApp());
}

<<<<<<< HEAD
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Flutter App")),
      body: const Center(child: Text("IM ABDULLAH REHMAN")),
=======
class CareerPilotApp extends StatelessWidget {
  const CareerPilotApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'CareerPilot',
      theme: AppTheme.dark(),
      routerConfig: router,
      debugShowCheckedModeBanner: false,
>>>>>>> 3e9128ab75037a920e8e2d9f7e053657d0ded91c
    );
  }
}
