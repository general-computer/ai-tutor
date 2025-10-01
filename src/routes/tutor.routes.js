const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutor.controller');

// Generate Agora token for client
router.post('/token', tutorController.generateToken);

// Start tutoring session
router.post('/session/start', tutorController.startSession);

// Process incoming speech-to-text
router.post('/process', tutorController.processMessage);

// End tutoring session
router.post('/session/end', tutorController.endSession);

module.exports = router;