import { useEffect, useState } from 'react';
import api from '../../services/api';
import { DetailPanel } from '../ui/DetailPanel';
import { useI18n } from '../../context/I18nContext';

export default function BlockchainViewer({ elderId }) {
  const { t } = useI18n();
  const [data, setData] = useState({ chain: [], verification: {} });

  useEffect(() => {
    if (!elderId) return;
    api.get(`/features/blockchain/${elderId}`).then(r => setData(r.data)).catch(() => {});
  }, [elderId]);

  const { chain, verification } = data;

  return (
    <DetailPanel title={t('blockchainRecords')} icon="⛓️" subtitle={t('blockchainDesc')}>
      <div className={`p-3 rounded-xl mb-3 text-sm font-medium ${verification.valid ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
        {verification.valid ? '✅ ' + t('chainValid') : '❌ ' + t('chainInvalid')} · {verification.blocks || 0} {t('blocks')}
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {chain.length === 0 ? (
          <p className="text-sm text-slate-500">{t('noData')}</p>
        ) : (
          chain.slice().reverse().map(block => (
            <div key={block.id} className="p-2 bg-slate-50 rounded-lg text-xs font-mono">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">#{block.block_index} · {block.record_type}</span>
                <span className="text-slate-400">{new Date(block.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-500 truncate">hash: {block.block_hash?.slice(0, 24)}...</p>
            </div>
          ))
        )}
      </div>
    </DetailPanel>
  );
}
