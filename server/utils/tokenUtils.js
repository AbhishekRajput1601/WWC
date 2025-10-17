import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// Generate JWT Token
export const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

// Verify JWT Token
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};