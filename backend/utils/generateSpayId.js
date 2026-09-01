const crypto = require('crypto');

const generateSpayId = () => {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SPAY${random}`;
};

module.exports = generateSpayId;
