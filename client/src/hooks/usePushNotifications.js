import { useEffect } from 'react';
import api from '../services/api';

export function usePushNotifications(enabled = true) {
  useEffect(() => {
    if (!enabled || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await api.post('/dashboard/push-subscribe', { subscription: existing.toJSON() });
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await api.post('/dashboard/push-subscribe', { subscription: sub.toJSON() });
      } catch (err) {
        console.warn('Push subscription skipped:', err.message);
      }
    }

    subscribe();
  }, [enabled]);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
