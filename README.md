# ElderCare Monitor — Full Edition

Comprehensive elderly health monitoring with 12 elders, 90-day history, admin panel, family portal, IoT, analytics, and full Tamil/English support.

## Demo Accounts (password: `password123`)

| Role | Email |
|------|-------|
| Elder | elder@demo.com, pappamma@demo.com, murugan@demo.com (+ 9 more) |
| Caretaker | caretaker@demo.com (+ 4 more) |
| Doctor | doctor@demo.com (+ 2 more) |
| **Admin** | admin@demo.com |
| **Family** | family@demo.com |

## Quick Start

```bash
docker compose up postgres redis -d
cd server && npm install && npm run migrate && npm run seed && npm run dev
cd client && npm install && npm run dev
```

## New Features (1–12 Full Expansion)

1. **Expanded profiles** — DOB, gender, BMI, chronic conditions, allergies, mobility, insurance, emergency contacts
2. **Extended vitals** — SpO2, glucose, temperature, pain, mood, hydration
3. **Rich medications** — type, food timing, pharmacy, stock, side effects
4. **Lifestyle tracking** — water, exercise, falls, location, weather, calories
5. **Clinical records** — lab results, prescriptions, appointment types, diagnosis codes
6. **Advanced alerts** — configurable rules, WhatsApp/SMS, geofence, missed vitals cron
7. **Analytics** — health score, risk breakdown, CSV/PDF export, 30/90-day trends
8. **IoT integration** — smartwatch devices, live readings, geofence alerts
9. **Admin panel** — user management, assignments, audit logs, alert rules
10. **Massive seed data** — 12 elders, 5 caretakers, 3 doctors, 90 days each
11. **Family portal** — read-only health view for relatives
12. **Full i18n** — Tamil/English toggle on all dashboards

## Premium Features (1–10)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Tamil Voice Assistant** | Speech-to-text vitals logging in Tamil/English |
| 2 | **WhatsApp Alerts** | Send health alerts via WhatsApp (Twilio mock) |
| 3 | **Fall Detection AI** | Device motion / accelerometer fall detection |
| 4 | **Live GPS Map** | Real-time elder location on OpenStreetMap (Leaflet) |
| 5 | **Telemedicine Video** | Jitsi Meet video consultations |
| 6 | **React Native Mobile App** | Expo app in `/mobile` — GPS, fall, SOS |
| 7 | **AI Health Prediction** | 7-day risk forecast from vitals/activity/meds |
| 8 | **Smart Pill Box IoT** | Compartment tracking with missed-dose alerts |
| 9 | **Blockchain Records** | SHA-256 tamper-proof health record chain |
| 10 | **Govt Hospital Integration** | ABDM mock sync with TN govt hospitals |

### Premium API

- `/api/features/voice/:elderId` — Voice assistant
- `/api/features/whatsapp/:elderId` — WhatsApp alerts
- `/api/features/fall/:elderId` — Fall detection
- `/api/features/gps/:elderId` — GPS tracking
- `/api/features/video/:elderId` — Telemedicine sessions
- `/api/features/ai-prediction/:elderId` — AI risk prediction
- `/api/features/pillbox/:elderId` — Smart pill box
- `/api/features/blockchain/:elderId` — Blockchain records
- `/api/features/hospitals/*` — Hospital integration

### Mobile App

```bash
cd mobile && npm install && npx expo start
```

## API Endpoints

- `/api/admin/*` — Admin panel (stats, users, assignments, audit, alert rules)
- `/api/analytics/:elderId` — Health analytics, scores, exports, lab, prescriptions
- `/api/iot/:elderId/devices` — IoT device management and readings

See previous README sections for core auth, vitals, medications, appointments endpoints.
