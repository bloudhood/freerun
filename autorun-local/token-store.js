const crypto = require('crypto');

const TOKEN_FIELD = '_token_enc';
const TOKEN_VERSION = 'v1';

function normalizeSecret(secret) {
  return `${secret || ''}`.trim();
}

function deriveKey(secret) {
  return crypto.createHash('sha256').update(normalizeSecret(secret)).digest();
}

function taskDiskKey(token, secret) {
  return crypto.createHmac('sha256', normalizeSecret(secret)).update(`${token || ''}`).digest('hex');
}

function encryptToken(token, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(`${token || ''}`, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    TOKEN_VERSION,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

function decryptToken(payload, secret) {
  const [version, ivText, tagText, ciphertextText] = `${payload || ''}`.split(':');
  if (version !== TOKEN_VERSION || !ivText || !tagText || !ciphertextText) {
    throw new Error('Unsupported encrypted token payload');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(secret), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function serializeTasksForDisk(tasks = {}, secret = '') {
  const normalizedSecret = normalizeSecret(secret);
  if (!normalizedSecret) return tasks;

  return Object.entries(tasks || {}).reduce((acc, [token, task]) => {
    const { [TOKEN_FIELD]: _ignored, ...rest } = task || {};
    acc[taskDiskKey(token, normalizedSecret)] = {
      ...rest,
      [TOKEN_FIELD]: encryptToken(token, normalizedSecret),
    };
    return acc;
  }, {});
}

function hydrateTasksFromDisk(rawTasks = {}, secret = '') {
  const normalizedSecret = normalizeSecret(secret);
  if (!rawTasks || typeof rawTasks !== 'object') return {};
  if (!normalizedSecret) return rawTasks;

  return Object.entries(rawTasks).reduce((acc, [key, task]) => {
    if (task && typeof task === 'object' && task[TOKEN_FIELD]) {
      const token = decryptToken(task[TOKEN_FIELD], normalizedSecret);
      const { [TOKEN_FIELD]: _ignored, ...rest } = task;
      acc[token] = rest;
    } else {
      acc[key] = task;
    }
    return acc;
  }, {});
}

function maskToken(token) {
  return crypto.createHash('sha256').update(`${token || ''}`).digest('hex').slice(0, 8);
}

module.exports = {
  hydrateTasksFromDisk,
  maskToken,
  serializeTasksForDisk,
};
