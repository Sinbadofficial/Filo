import 'package:flutter/material.dart';
import '../api/client.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<dynamic> _orders = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final orders = await widget.api.getOrders();
    setState(() => _orders = orders);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _orders.length,
        itemBuilder: (context, index) {
          final o = _orders[index];
          return Card(
            child: ListTile(
              title: Text(o['orderNumber'] as String),
              subtitle: Text('${o['customerName']} • ${o['status']}'),
              trailing: Text('৳${o['totalAmount']}'),
            ),
          );
        },
      ),
    );
  }
}
