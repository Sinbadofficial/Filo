import 'package:flutter/material.dart';
import 'api/client.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const ResellBDApp());
}

class ResellBDApp extends StatelessWidget {
  const ResellBDApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ResellBD',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF059669)),
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final _api = ApiClient();
  bool _loading = true;
  bool _loggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    await _api.loadSession();
    try {
      final res = await _api.getWallet();
      setState(() {
        _loggedIn = res.containsKey('balance');
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _loggedIn = false;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!_loggedIn) {
      return LoginScreen(api: _api, onLogin: () => setState(() => _loggedIn = true));
    }
    return HomeScreen(api: _api);
  }
}
