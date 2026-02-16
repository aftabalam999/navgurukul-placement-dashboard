const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const tokenFromHeader = req.header('Authorization')?.replace('Bearer ', '');
    const tokenFromCookie = req.cookies?.auth_token;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Debug: show token summary (length and start/end) to help debug mismatches
    if (process.env.NODE_ENV !== 'production') {
      try {
        const start = token.slice(0, 8);
        const end = token.slice(-8);
        console.debug(`auth middleware - verifying token (len=${token.length}) start=${start} end=${end}`);
      } catch (e) {
        // ignore slicing errors
      }
    }

    // Verify and load user
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('auth middleware - token verify error:', err.message);
      return res.status(401).json({ message: 'Token is invalid or expired' });
    }

    console.debug('auth middleware - token decoded for userId:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('auth middleware - unexpected error:', error);
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    const allowed = roles.map(r => String(r).trim().toLowerCase());
    if (!allowed.includes(userRole)) {
      console.warn(`Authorization denied for user ${req.userId} (role=${req.user?.role}). Allowed roles: ${roles.join(', ')}`);
      return res.status(403).json({
        message: 'Access denied. You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Check if user is from same campus (for Campus POCs)
const sameCampus = async (req, res, next) => {
  try {
    if (req.user.role === 'manager' || req.user.role === 'coordinator') {
      return next(); // Managers and coordinators have access to all campuses
    }

    const targetUserId = req.params.studentId || req.params.userId;
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser && targetUser.campus) {
        // Normalize IDs to strings for comparison
        const targetCampusId = targetUser.campus.toString();

        const managedIds = (req.user.managedCampuses || []).map(c => c.toString());
        const primaryCampusId = req.user.campus?.toString();

        const allAllowedIds = [...managedIds];
        if (primaryCampusId) allAllowedIds.push(primaryCampusId);

        if (!allAllowedIds.includes(targetCampusId)) {
          console.warn(`Access denied for ${req.user.role} ${req.userId}. Student campus ${targetCampusId} not in allowed: [${allAllowedIds.join(', ')}]`);
          return res.status(403).json({
            message: 'Access denied. You can only access students from your managed campuses.'
          });
        }
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, authorize, sameCampus };
