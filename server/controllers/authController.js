const bcrypt = require('bcryptjs');
const db = require('../models/db');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../services/jwt');

async function register(req, res, next) {
  try {
    const { name, email, password, role, phone, age, blood_group, emergency_contact, address } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['elder', 'caretaker', 'doctor', 'family'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [user] = await db('users')
      .insert({ name, email, password_hash, role, phone })
      .returning(['id', 'name', 'email', 'role', 'phone', 'created_at']);

    let elder = null;
    if (role === 'elder') {
      [elder] = await db('elders')
        .insert({
          user_id: user.id,
          age,
          blood_group,
          emergency_contact,
          address,
        })
        .returning('*');
    }

    const tokens = await issueTokens(user);

    res.status(201).json({ user, elder, ...tokens });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let elder = null;
    if (user.role === 'elder') {
      elder = await db('elders').where({ user_id: user.id }).first();
    }

    const tokens = await issueTokens(user);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      elder,
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const stored = await db('refresh_tokens').where({ token: refreshToken }).first();
    if (!stored || new Date(stored.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      await db('refresh_tokens').where({ token: refreshToken }).del();
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await db('users').where({ id: decoded.id }).first();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    await db('refresh_tokens').where({ token: refreshToken }).del();
    const tokens = await issueTokens(user);

    res.json(tokens);
  } catch (err) {
    next(err);
  }
}

async function issueTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db('refresh_tokens').insert({
    user_id: user.id,
    token: refreshToken,
    expires_at: expiresAt,
  });

  return { accessToken, refreshToken };
}

async function me(req, res, next) {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'name', 'email', 'role', 'phone', 'created_at')
      .first();

    let elder = null;
    if (user.role === 'elder') {
      elder = await db('elders').where({ user_id: user.id }).first();
    }

    res.json({ user, elder });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, me };
