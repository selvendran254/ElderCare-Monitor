import { useState } from 'react';
import api from '../../services/api';
import { DetailPanel } from '../ui/DetailPanel';
import Button from '../ui/Button';
import { useI18n } from '../../context/I18nContext';

export default function WhatsAppAlert({ elderId, defaultPhone = '' }) {
  const { t, lang } = useI18n();
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const send = async () => {
    const { data } = await api.post(`/features/whatsapp/${elderId}`, {
      phone,
      message,
      language: lang,
    });
    setResult(data);
  };

  return (
    <DetailPanel title={t('whatsappAlerts')} icon="💬" subtitle={t('whatsappDesc')}>
      <div className="space-y-3">
        <input type="tel" placeholder="+91XXXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="input-field-lg w-full" />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t('alertMessage')} className="input-field-lg w-full min-h-[60px]" />
        <Button variant="elder" onClick={send} disabled={!phone || !message}>📲 {t('sendWhatsApp')}</Button>
        {result && (
          <p className="text-sm text-emerald-700">
            {result.mock ? '📱 ' + t('mockSent') : '✅ ' + t('sent')}: {result.message || result.status}
          </p>
        )}
      </div>
    </DetailPanel>
  );
}
