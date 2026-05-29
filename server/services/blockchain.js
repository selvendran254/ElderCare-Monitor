const crypto = require('crypto');
const db = require('../models/db');

function hash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

async function getLastBlock(elderId) {
  return db('blockchain_records').where('elder_id', elderId).orderBy('block_index', 'desc').first();
}

async function addRecord(elderId, recordType, recordId, data) {
  const last = await getLastBlock(elderId);
  const blockIndex = last ? last.block_index + 1 : 0;
  const prevHash = last ? last.block_hash : '0';
  const dataHash = hash(data);
  const blockHash = hash({ prevHash, dataHash, blockIndex, elderId, recordType, recordId, ts: Date.now() });

  const [record] = await db('blockchain_records').insert({
    elder_id: elderId,
    record_type: recordType,
    record_id: recordId,
    data_hash: dataHash,
    prev_hash: prevHash,
    block_hash: blockHash,
    block_index: blockIndex,
  }).returning('*');

  return record;
}

async function verifyChain(elderId) {
  const chain = await db('blockchain_records').where('elder_id', elderId).orderBy('block_index', 'asc');
  if (!chain.length) return { valid: true, blocks: 0 };

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];
    if (i === 0 && block.prev_hash !== '0') return { valid: false, error: `Block 0 invalid prev_hash`, blocks: chain.length };
    if (i > 0 && block.prev_hash !== chain[i - 1].block_hash) {
      return { valid: false, error: `Block ${i} chain broken`, blocks: chain.length };
    }
  }
  return { valid: true, blocks: chain.length };
}

async function getChain(elderId) {
  return db('blockchain_records').where('elder_id', elderId).orderBy('block_index', 'asc');
}

module.exports = { addRecord, verifyChain, getChain, hash };
