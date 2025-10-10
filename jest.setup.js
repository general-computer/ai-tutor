// Set environment to test
process.env.NODE_ENV = 'test';

// Clear any intervals before tests run
beforeAll(async () => {
  // Import the conversation module
  const conversation = require('./src/utils/conversation');
  
  // Clear intervals
  if (typeof conversation.clearIntervals === 'function') {
    conversation.clearIntervals();
  }
});

// Clear any intervals after tests complete
afterAll(async () => {
  // Import the conversation module
  const conversation = require('./src/utils/conversation');
  
  // Clear intervals
  if (typeof conversation.clearIntervals === 'function') {
    conversation.clearIntervals();
  }
  
  // Add a small delay to ensure cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});
