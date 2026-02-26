# MyAI Mobile

iOS & Android app for the MyAI decentralized GPU compute network.

Built with **Expo** (React Native) — one codebase, both platforms.

## Features

- **Dashboard** — live network stats, online providers, your balance
- **Earnings** — MYAI balance, transaction history, earnings breakdown
- **Jobs** — submit AI inference jobs, track status, view results
- **Agents** — browse all GPU providers, view hardware specs, dispatch test jobs
- **Wallet** — manage MYAI + USD balance, top up, transaction history
- **Settings** — account info, logout

## Stack

- Expo ~51 + React Native 0.74
- React Navigation (bottom tabs + native stack)
- TanStack Query v5 (data fetching + caching)
- Zustand (client state)
- `@expo/vector-icons` (MaterialCommunityIcons)
- expo-secure-store (token storage)

## API

Connects to:
- **`https://api.myaitoken.io`** — coordinator (GPU agents, jobs, network stats)
- **`https://myaitoken.io`** — website API (auth, wallet, transactions)

Auth: `POST /api/mobile/auth` → returns JWT → sent as `Authorization: Bearer <token>`

## Quick Start

```bash
# Install
npm install

# Start (Expo Go)
npx expo start

# iOS simulator
npx expo run:ios

# Android emulator
npx expo run:android
```

Scan the QR code with **Expo Go** on your phone for instant preview.

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# iOS build
eas build --platform ios

# Android build
eas build --platform android
```

## Project Structure

```
src/
├── api/
│   └── client.ts          # API client — coordinator + website
├── navigation/
│   └── AppNavigator.tsx   # Tab + stack navigator
├── screens/
│   ├── LoginScreen.tsx    # Email/password auth
│   ├── DashboardScreen.tsx
│   ├── EarningsScreen.tsx
│   ├── JobsScreen.tsx
│   ├── AgentsScreen.tsx
│   ├── AgentDetailsScreen.tsx
│   ├── WalletScreen.tsx
│   └── SettingsScreen.tsx
└── store/
    └── index.ts           # Zustand stores
```

## License

MIT — myaitoken.io
