const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutor.controller');

// Test LLM configuration ß
router.post('/test/llm', tutorController.testLLM);

// Generate Agora token for client
router.post('/token', tutorController.generateToken);

// Start tutoring session
router.post('/session/start', tutorController.startSession);

// Process incoming speech-to-text
router.post('/process', tutorController.processMessage);

// End tutoring session
router.post('/session/end', tutorController.endSession);

module.exports = router;