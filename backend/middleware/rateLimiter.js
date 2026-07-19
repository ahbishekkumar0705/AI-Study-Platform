const rateLimitMap = new Map();

/**
 * Basic in-memory rate limiting middleware.
 * 
 * @param {number} limit - max requests
 * @param {number} windowMs - time window in ms
 */
export const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }
    
    // Filter out requests outside the time window
    const requests = rateLimitMap.get(ip).filter((timestamp) => now - timestamp < windowMs);
    requests.push(now);
    rateLimitMap.set(ip, requests);
    
    if (requests.length > limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
      });
    }
    
    next();
  };
};
