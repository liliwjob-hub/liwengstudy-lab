# 练平甩 V1 — Expo SDK 54

平甩功 practice tracker for **Expo Go SDK 54** (Android / iPhone).

## Install & run

```cmd
cd /d D:\LiMVPapp\MVP1PingShui
npm install
npx expo install --fix
node scripts\create-placeholder-assets.js
npm run start
```

Scan QR with **Expo Go (SDK 54)**.

If scan spins forever → try:

```cmd
npm run start:tunnel
```

## Features

- 練習: 10 / 20 / 30 / 60 min sessions, voice 一～五, progress bar
- 紀錄: day / week / year, goals day / day×7 / day×7×300
- Bars: green = met, yellow = below goal, empty = 0

## Data

Stored on phone: `AsyncStorage` keys `@lianpingshuai/sessions` and `@lianpingshuai/daily_threshold_minutes` — see `src/storage/historyStorage.ts`.
