import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useI18n } from '../context/I18nContext';
import Button from './ui/Button';
import { DetailPanel } from './ui/DetailPanel';

const TAMIL_PROMPTS = [
  'என் இதய துடிப்பு 72',
  'என் இரத்த அழுத்தம் 130 by 85',
  'என் ஆக்ஸிஜன் 96',
  'என் சர்க்கரை 110',
];

export default function TamilVoiceAssistant({ elderId }) {
  const { t, lang } = useI18n();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState(null);
  const [message, setMessage] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(text);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, [lang]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setMessage(lang === 'ta' ? 'இந்த browser-ல் voice support இல்லை' : 'Voice not supported in this browser');
      return;
    }
    setTranscript('');
    setParsed(null);
    setListening(true);
    recognitionRef.current.start();
  };

  const applyVitals = async () => {
    if (!transcript.trim()) return;
    const { data } = await api.post(`/features/voice/${elderId}/apply`, {
      transcript,
      language: lang,
    });
    setParsed(data.parsed);
    setMessage(data.vital ? t('saveVitals') + ' ✓' : (data.message || 'Parsed'));
  };

  const useSample = (text) => setTranscript(text);

  return (
    <DetailPanel title={t('voiceAssistant')} icon="🎙️" subtitle={lang === 'ta' ? 'தமிழில் பேசி vitals பதிவு செய்யுங்கள்' : 'Speak to log vitals in Tamil/English'}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant={listening ? 'danger' : 'elder'} onClick={startListening} disabled={listening}>
            {listening ? '🔴 ' + t('listening') : '🎙️ ' + t('startVoice')}
          </Button>
          <Button variant="secondary" onClick={applyVitals} disabled={!transcript.trim()}>
            ✓ {t('applyVitals')}
          </Button>
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={lang === 'ta' ? 'இங்கே பேசியது தோன்றும்... அல்லது type செய்யுங்கள்' : 'Transcript appears here... or type manually'}
          className="input-field-lg w-full min-h-[80px]"
        />

        <div>
          <p className="text-xs text-slate-500 mb-2">{t('samplePhrases')}:</p>
          <div className="flex flex-wrap gap-2">
            {TAMIL_PROMPTS.map((p) => (
              <button key={p} onClick={() => useSample(p)} className="text-xs px-2 py-1 bg-slate-100 rounded-lg hover:bg-slate-200">{p}</button>
            ))}
          </div>
        </div>

        {parsed && (
          <div className="p-3 bg-emerald-50 rounded-xl text-sm grid grid-cols-2 gap-2">
            {parsed.heart_rate && <span>❤️ HR: {parsed.heart_rate}</span>}
            {parsed.blood_pressure_sys && <span>🩺 BP: {parsed.blood_pressure_sys}/{parsed.blood_pressure_dia}</span>}
            {parsed.spo2 && <span>💨 SpO2: {parsed.spo2}%</span>}
            {parsed.blood_glucose && <span>🩸 Glucose: {parsed.blood_glucose}</span>}
          </div>
        )}
        {message && <p className="text-emerald-700 text-sm font-medium">{message}</p>}
      </div>
    </DetailPanel>
  );
}
