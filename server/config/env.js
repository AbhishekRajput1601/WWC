// Environment configuration
export const config = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zoom-clone',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  port: process.env.PORT || 5000,
};