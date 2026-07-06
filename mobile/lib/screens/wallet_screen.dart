import 'package:flutter/material.dart';
import '../api/client.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  double _balance = 0;
  List<dynamic> _transactions = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await widget.api.getWallet();
    setState(() {
      _balance = (data['balance'] as num).toDouble();
      _transactions = data['transactions'] as List;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text('Wallet Balance'),
              Text('৳$_balance', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _transactions.length,
            itemBuilder: (context, index) {
              final tx = _transactions[index];
              final amount = (tx['amount'] as num).toDouble();
              return ListTile(
                title: Text(tx['type'] as String),
                subtitle: Text(tx['description'] as String? ?? ''),
                trailing: Text(
                  '৳$amount',
                  style: TextStyle(color: amount >= 0 ? Colors.green : Colors.red),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
