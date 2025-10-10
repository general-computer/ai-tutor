const loggerMiddleware = require('../../src/middleware/logger');
const logger = require('../../src/utils/logger');

// Mock dependencies
jest.mock('../../src/utils/logger');

describe('Logger Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/test'
    };
    
    res = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      })
    };
    
    next = jest.fn();
    
    // Mock Date.now for consistent timing
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)  // Start time
      .mockReturnValueOnce(1200); // End time (200ms later)
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should log request details when response finishes', () => {
    loggerMiddleware(req, res, next);
    
    // Verify next was called
    expect(next).toHaveBeenCalled();
    
    // Verify logger was called with correct info
    expect(logger.info).toHaveBeenCalledWith({
      method: 'GET',
      url: '/test',
      status: 200,
      duration: '200ms'
    });
  });
});
