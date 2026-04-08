const { DEFAULT_PROVIDER, SUPPORTED_PROVIDERS } = require('../utils/constants');

const PROVIDERS = {
  openai: () => require('./openai'),
  claude: () => require('./claude'),
};

function getProvider() {
  const name = process.env.EMAIL_PROVIDER || DEFAULT_PROVIDER;
  const loader = PROVIDERS[name];

  if (!loader) {
    throw new Error(`Unknown EMAIL_PROVIDER: "${name}". Supported: ${SUPPORTED_PROVIDERS.join(', ')}`);
  }

  return loader();
}

module.exports = { getProvider };
