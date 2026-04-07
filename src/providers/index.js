const PROVIDERS = {
  openai: () => require('./openai'),
  claude: () => require('./claude'),
};

function getProvider() {
  const name = process.env.EMAIL_PROVIDER || 'openai';
  const loader = PROVIDERS[name];

  if (!loader) {
    const supported = Object.keys(PROVIDERS).join(', ');
    throw new Error(`Unknown EMAIL_PROVIDER: "${name}". Supported: ${supported}`);
  }

  return loader();
}

module.exports = { getProvider };
