import 'package:flutter/material.dart';
import '../api/client.dart';
import 'catalog_screen.dart';
import 'orders_screen.dart';
import 'wallet_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      CatalogScreen(api: widget.api),
      OrdersScreen(api: widget.api),
      WalletScreen(api: widget.api),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('ResellBD')),
      body: screens[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.store), label: 'Catalog'),
          NavigationDestination(icon: Icon(Icons.shopping_bag), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet), label: 'Wallet'),
        ],
      ),
    );
  }
}
