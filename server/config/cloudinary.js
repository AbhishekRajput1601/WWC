import { v2 as cloudinary } from 'cloudinary';
import { config as env } from './env.js';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export default cloudinary;
