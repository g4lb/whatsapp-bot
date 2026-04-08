require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger').child({ module: 'server' });
const { DEFAULT_PORT } = require('./utils/constants');

const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});
