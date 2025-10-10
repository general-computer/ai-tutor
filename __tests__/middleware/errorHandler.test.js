const errorHandler = require('../../src/middleware/errorHandler');
const logger = require('../../src/utils/logger');

// Mock dependencies
jest.mock('../../src/utils/logger');

describe('Error Handler Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  it('should log error details and return 500 status for generic errors', () => {
    const err = new Error('Test error');
    
    errorHandler(err, req, res, next);
    
    expect(logger.error).toHaveBeenCalledWith({
      message: 'Test error',
      stack: err.stack,
      url: '/test',
      method: 'GET'
    });
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: expect.any(String)
      })
    });
  });
  
  it('should use the status code from the error if provided', () => {
    const err = new Error('Not found');
    err.status = 404;
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
