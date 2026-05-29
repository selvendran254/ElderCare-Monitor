import { useState } from 'react';
import TamilVoiceAssistant from './TamilVoiceAssistant';
import LiveMap from './LiveMap';
import VideoCall from './VideoCall';
import FallDetector from './FallDetector';
import AIPredictionChart from './AIPredictionChart';
import PillBoxStatus from './PillBoxStatus';
import BlockchainViewer from './BlockchainViewer';
import HospitalIntegration from './HospitalIntegration';
import WhatsAppAlert from './WhatsAppAlert';
import { useI18n } from '../../context/I18nContext';

const TABS = [
  { id: 'voice', icon: '🎙️', key: 'voiceAssistant' },
  { id: 'whatsapp', icon: '💬', key: 'whatsappAlerts' },
  { id: 'fall', icon: '🚨', key: 'fallDetection' },
  { id: 'gps', icon: '📍', key: 'liveGpsMap' },
  { id: 'video', icon: '📹', key: 'telemedicine' },
  { id: 'ai', icon: '🤖', key: 'aiPrediction' },
  { id: 'pillbox', icon: '💊', key: 'smartPillBox' },
  { id: 'blockchain', icon: '⛓️', key: 'blockchainRecords' },
  { id: 'hospital', icon: '🏥', key: 'hospitalIntegration' },
];

export default function SmartFeaturesPanel({ elderId, userPhone }) {
  const { t } = useI18n();
  const [tab, setTab] = useState('voice');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${tab === item.id ? 'bg-emerald-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {item.icon} {t(item.key)}
          </button>
        ))}
      </div>

      {tab === 'voice' && <TamilVoiceAssistant elderId={elderId} />}
      {tab === 'whatsapp' && <WhatsAppAlert elderId={elderId} defaultPhone={userPhone} />}
      {tab === 'fall' && <FallDetector elderId={elderId} />}
      {tab === 'gps' && <LiveMap elderId={elderId} />}
      {tab === 'video' && <VideoCall elderId={elderId} />}
      {tab === 'ai' && <AIPredictionChart elderId={elderId} />}
      {tab === 'pillbox' && <PillBoxStatus elderId={elderId} />}
      {tab === 'blockchain' && <BlockchainViewer elderId={elderId} />}
      {tab === 'hospital' && <HospitalIntegration elderId={elderId} />}
    </div>
  );
}
