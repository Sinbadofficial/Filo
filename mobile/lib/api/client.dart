import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  ApiClient({this.baseUrl = 'http://10.0.2.2:3000'});

  final String baseUrl;
  String? _cookie;

  Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    _cookie = prefs.getString('session_cookie');
  }

  Future<void> saveSession(String? cookie) async {
    _cookie = cookie;
    final prefs = await SharedPreferences.getInstance();
    if (cookie != null) {
      await prefs.setString('session_cookie', cookie);
    } else {
      await prefs.remove('session_cookie');
    }
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_cookie != null) 'Cookie': _cookie!,
      };

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final cookie = res.headers['set-cookie'];
    if (cookie != null) {
      await saveSession(cookie.split(';').first);
    }

    if (res.statusCode != 200) {
      throw Exception(jsonDecode(res.body)['error'] ?? 'Login failed');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getProducts() async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/products'),
      headers: _headers,
    );
    if (res.statusCode != 200) throw Exception('Failed to load products');
    return (jsonDecode(res.body) as Map)['products'] as List;
  }

  Future<List<dynamic>> getShop() async {
    final res = await http.get(Uri.parse('$baseUrl/api/shop'), headers: _headers);
    if (res.statusCode != 200) throw Exception('Failed to load shop');
    return (jsonDecode(res.body) as Map)['shopProducts'] as List;
  }

  Future<List<dynamic>> getOrders() async {
    final res = await http.get(Uri.parse('$baseUrl/api/orders'), headers: _headers);
    if (res.statusCode != 200) throw Exception('Failed to load orders');
    return (jsonDecode(res.body) as Map)['orders'] as List;
  }

  Future<Map<String, dynamic>> getWallet() async {
    final res = await http.get(Uri.parse('$baseUrl/api/wallet'), headers: _headers);
    if (res.statusCode != 200) throw Exception('Failed to load wallet');
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<void> addToShop(String productId, double sellingPrice) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/shop'),
      headers: _headers,
      body: jsonEncode({'productId': productId, 'sellingPrice': sellingPrice}),
    );
    if (res.statusCode != 200) {
      throw Exception(jsonDecode(res.body)['error'] ?? 'Failed');
    }
  }

  Future<void> createOrder(Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/orders'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    if (res.statusCode != 200) {
      throw Exception(jsonDecode(res.body)['error'] ?? 'Failed');
    }
  }
}
