function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
  }
  
  function ensureValidToken(req, res, next) {
    // JWT validation logic here
    next();
  }
  
  module.exports = { ensureAuthenticated, ensureValidToken };