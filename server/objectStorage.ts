import { randomUUID } from "crypto";

// Upload file to object storage and return public URL
export async function uploadToObjectStorage(file: Express.Multer.File, folder: string = 'posts'): Promise<string> {
  try {
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${folder}/${randomUUID()}.${fileExtension}`;
    
    // For now, we'll use object storage via the file system API
    // In production, this would upload to cloud storage like S3 or GCS
    const publicPath = `${process.env.PUBLIC_OBJECT_SEARCH_PATHS?.[0] || '/tmp'}/${fileName}`;
    
    // Write file to public directory
    const fs = await import('fs/promises');
    await fs.mkdir(`${process.env.PUBLIC_OBJECT_SEARCH_PATHS?.[0] || '/tmp'}/${folder}`, { recursive: true });
    await fs.writeFile(publicPath, file.buffer);
    
    // Return the public URL that can be used to access the image
    return `/public/${fileName}`;
  } catch (error) {
    console.error('Error uploading to object storage:', error);
    throw new Error('Failed to upload image');
  }
}

// Upload multiple files to object storage
export async function uploadMultipleToObjectStorage(files: Express.Multer.File[], folder: string = 'posts'): Promise<string[]> {
  const uploadPromises = files.map(file => uploadToObjectStorage(file, folder));
  return await Promise.all(uploadPromises);
}