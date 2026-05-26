# 练平甩 V1 — Project status (saved in this folder)

**Location:** `D:\LiMVPapp\MVP1PingShui`  
**Expo SDK:** 54 (matches Expo Go SDK 54)

## 平甩 animation

- Built-in animated figure (no GIF required)
- Count 一–五 on backward swing; count 5 includes leg bend twice
- Background: piano (`assets/piano-relax.mp3` or online fallback)

## Latest fixes (in this folder)

1. **Stop button** — `src/screens/SessionScreen.tsx`  
   - Pauses timer immediately on web/phone  
   - Modal dialog (not Alert) — **停止並儲存 · Stop & Save** records actual minutes practiced  

2. **Bilingual UI** — Chinese + English on labels  
   - `src/components/BilingualText.tsx`  
   - `src/constants/labels.ts`  
   - All screens updated  

3. **History goals**  
   - Day = daily threshold  
   - Week = daily × 7  
   - Year = daily × 7 × 300  
   - Green / yellow / empty bars  

## Run

```cmd
cd /d D:\LiMVPapp\MVP1PingShui
npm run web
```

```cmd
npm run start
```

Refresh browser (Ctrl+F5) after code changes.
