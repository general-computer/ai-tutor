const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const loggerMiddleware = require('./middleware/logger');

const tutorRoutes = require('./routes/tutor.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// Routes
app.use('/api/tutor', tutorRoutes);
app.use('/health', healthRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`SAT Tutor server running on port ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

module.exports = app;
