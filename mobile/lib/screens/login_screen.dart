import 'package:flutter/material.dart';
import '../api/client.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.api, required this.onLogin});

  final ApiClient api;
  final VoidCallback onLogin;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: 'reseller@demo.com');
  final _password = TextEditingController(text: 'reseller123');
  String? _error;
  bool _loading = false;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      await widget.api.login(_email.text, _password.text);
      widget.onLogin();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              const Text('ResellBD', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
              const Text('Reseller Login'),
              const SizedBox(height: 32),
              TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
              TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
              if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: Colors.red))),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _loading ? null : _login,
                child: Text(_loading ? 'Logging in...' : 'Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
