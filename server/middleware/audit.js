const db = require('../models/db');

async function logAudit(userId, action, entityType, entityId, details, ip) {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details ? JSON.stringify(details) : null,
      ip_address: ip,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

function auditMiddleware(action, entityType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400 && req.user) {
        logAudit(req.user.id, action, entityType, body?.id || req.params.id, body, req.ip);
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { logAudit, auditMiddleware };
