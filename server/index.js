require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { verifyAccessToken } = require('./services/jwt');
const { initWebPush } = require('./services/push');
const { startMedicationCron } = require('./services/cron');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const vitalsRoutes = require('./routes/vitals');
const medicationsRoutes = require('./routes/medications');
const activitiesRoutes = require('./routes/activities');
const appointmentsRoutes = require('./routes/appointments');
const alertsRoutes = require('./routes/alerts');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const iotRoutes = require('./routes/iot');
const featuresRoutes = require('./routes/features');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ElderCare Monitor' });
});

app.use('/api/auth', authRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/features', featuresRoutes);

app.use(errorHandler);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    socket.user = verifyAccessToken(token);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const { role, id } = socket.user;

  if (role === 'caretaker' || role === 'admin') {
    socket.join('caretakers');
  }

  socket.on('join-elder', (elderId) => {
    socket.join(`elder-${elderId}`);
    if (role === 'caretaker') {
      socket.join(`caretaker-${elderId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${id}`);
  });
});

initWebPush();
startMedicationCron();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`ElderCare Monitor server running on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
