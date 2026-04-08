const express = require('express');
const webhookRoutes = require('./routes/webhook');

const app = express();
app.use(express.json());
app.use(webhookRoutes);

module.exports = app;
