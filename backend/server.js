require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const skillRoutes = require('./routes/skills');
const notificationRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');
const placementCycleRoutes = require('./routes/placementCycles');
const campusRoutes = require('./routes/campuses');
const selfApplicationRoutes = require('./routes/selfApplications');
const jobReadinessRoutes = require('./routes/jobReadiness');
const bulkUploadRoutes = require('./routes/bulkUpload');

const app = express();

// Middleware - CORS Configuration
const allowedOrigins = [
  'https://navgurukul-placement-frontend.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now during testing
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_dashboard')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/placement-cycles', placementCycleRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/self-applications', selfApplicationRoutes);
app.use('/api/job-readiness', jobReadinessRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);

// Health check with detailed status
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  
  // Check MongoDB connection
  let dbStatus = 'disconnected';
  let dbLatency = null;
  let dbName = null;
  
  try {
    const dbStart = Date.now();
    await mongoose.connection.db.admin().ping();
    dbLatency = Date.now() - dbStart;
    dbStatus = 'connected';
    dbName = mongoose.connection.name;
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }
  
  const isProduction = process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv');
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: {
      uptime: process.uptime(),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    },
    database: {
      status: dbStatus,
      name: dbName,
      type: isProduction ? 'cloud (MongoDB Atlas)' : 'local',
      latency: dbLatency ? dbLatency + ' ms' : null
    },
    responseTime: (Date.now() - startTime) + ' ms'
  });
});

// Sync endpoint - triggers data sync from production (for development only)
app.post('/api/sync-from-production', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Sync not allowed in production' });
  }
  
  const { productionUri } = req.body;
  if (!productionUri) {
    return res.status(400).json({ message: 'Production MongoDB URI required' });
  }
  
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Run mongodump and mongorestore
    const localUri = 'mongodb://localhost:27017/placement_dashboard';
    const command = `mongodump --uri="${productionUri}" --archive | mongorestore --uri="${localUri}" --archive --drop`;
    
    await execPromise(command);
    res.json({ message: 'Sync completed successfully!' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Sync failed: ' + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
