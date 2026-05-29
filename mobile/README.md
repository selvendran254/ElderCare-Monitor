# ElderCare Mobile App (React Native / Expo)

Native mobile companion for ElderCare Monitor — GPS sharing, fall detection, SOS, and vitals view.

## Features
- Elder login (JWT)
- View latest vitals
- Share GPS location to caretaker map
- Accelerometer-based fall detection
- SOS emergency button

## Setup

```bash
cd mobile
npm install
npx expo start
```

Use **Android emulator** (`10.0.2.2:5000`) or update `src/services/api.js` with your machine IP for physical device.

## Demo
- Email: `elder@demo.com`
- Password: `password123`

Ensure backend is running: `cd server && npm run dev`
