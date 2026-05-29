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

## API Endpoints

- `/api/admin/*` — Admin panel (stats, users, assignments, audit, alert rules)
- `/api/analytics/:elderId` — Health analytics, scores, exports, lab, prescriptions
- `/api/iot/:elderId/devices` — IoT device management and readings

See previous README sections for core auth, vitals, medications, appointments endpoints.
