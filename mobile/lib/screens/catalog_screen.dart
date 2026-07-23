import 'dart:convert';
import 'package:flutter/material.dart';
import '../api/client.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  List<dynamic> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final products = await widget.api.getProducts();
    setState(() {
      _products = products;
      _loading = false;
    });
  }

  Future<void> _addToShop(dynamic product) async {
    final price = (product['resellerPrice'] as num) + 100;
    await widget.api.addToShop(product['id'] as String, price.toDouble());
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${product['name']} added to shop')),
      );
    }
  }

  Widget _productImage(String? imageUrl) {
    if (imageUrl == null || imageUrl.isEmpty) {
      return const Icon(Icons.image);
    }

    if (imageUrl.startsWith('data:image')) {
      try {
        final base64Part = imageUrl.split(',').last;
        final bytes = base64Decode(base64Part);
        return Image.memory(bytes, width: 48, height: 48, fit: BoxFit.cover);
      } catch (_) {
        return const Icon(Icons.broken_image);
      }
    }

    final url = imageUrl.startsWith('http')
        ? imageUrl
        : '${widget.api.baseUrl}$imageUrl';

    return Image.network(
      url,
      width: 48,
      height: 48,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => const Icon(Icons.broken_image),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _products.length,
      itemBuilder: (context, index) {
        final p = _products[index];
        return Card(
          child: ListTile(
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: _productImage(p['imageUrl'] as String?),
            ),
            title: Text(p['name'] as String),
            subtitle: Text('৳${p['resellerPrice']}'),
            trailing: IconButton(
              icon: const Icon(Icons.add_shopping_cart),
              onPressed: () => _addToShop(p),
            ),
          ),
        );
      },
    );
  }
}
