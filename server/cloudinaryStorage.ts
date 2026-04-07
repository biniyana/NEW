import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Cloudinary configuration missing. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

export class CloudinaryStorage {
  static async uploadImage(filePath: string, folder: string = 'garbish-uploads'): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  static async uploadBase64Image(base64Data: string, folder: string = 'garbish-uploads'): Promise<string> {
    try {
      // Extract MIME type from the data URL
      const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      // Remove data URL prefix if present
      const base64 = base64Data.replace(/^data:[^;]+;base64,/, '');

      if (!base64 || base64.length === 0) {
        throw new Error('Base64 string is empty after removing prefix');
      }

      const dataUrl = `data:${mimeType};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUrl, {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      return result.secure_url;
    } catch (error: any) {
      console.error('Cloudinary base64 upload error:', {
        errorMessage: error.message,
        errorCode: error.status || error.code,
        dataLength: base64Data.length,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to upload base64 image to Cloudinary: ${error.message}`);
    }
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  static getPublicIdFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const publicId = fileName.split('.')[0];
      const folder = urlParts[urlParts.length - 2];
      return `${folder}/${publicId}`;
    } catch (error) {
      console.error('Error extracting public ID from URL:', error);
      return null;
    }
  }
}