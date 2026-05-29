const webpush = require('web-push');
const db = require('../models/db');

function initWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@eldercare.local',
      publicKey,
      privateKey
    );
  }
}

async function sendPushToUser(userId, payload) {
  const subs = await db('push_subscriptions').where({ user_id: userId });

  if (!subs.length) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.log(`[Push mock] User ${userId}:`, payload);
    return;
  }

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 410) {
        await db('push_subscriptions').where({ id: sub.id }).del();
      }
    }
  }
}

async function saveSubscription(userId, subscription) {
  const existing = await db('push_subscriptions')
    .where({ user_id: userId })
    .first();

  if (existing) {
    return db('push_subscriptions')
      .where({ id: existing.id })
      .update({ subscription });
  }

  return db('push_subscriptions').insert({ user_id: userId, subscription });
}

module.exports = { initWebPush, sendPushToUser, saveSubscription };
