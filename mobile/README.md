# ResellBD Mobile App (Flutter)

Reseller mobile app for the ResellBD platform.

## Setup

```bash
cd mobile
flutter pub get
flutter run
```

## Configuration

Edit `lib/api/client.dart` — set `baseUrl` to your server:

- Android emulator: `http://10.0.2.2:3000`
- iOS simulator: `http://localhost:3000`
- Physical device: `http://YOUR_IP:3000`

## Features

- Login
- Browse product catalog
- Add products to shop
- View orders
- View wallet balance & transactions

## Demo login

- Email: `reseller@demo.com`
- Password: `reseller123`
