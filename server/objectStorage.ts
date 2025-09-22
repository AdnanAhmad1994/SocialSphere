import { randomUUID } from "crypto";
import path from "path";

// Upload file to object storage and return public URL
export async function uploadToObjectStorage(file: Express.Multer.File, folder: string = 'posts'): Promise<string> {
  try {
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${folder}/${randomUUID()}.${fileExtension}`;
    
    // Parse the PUBLIC_OBJECT_SEARCH_PATHS correctly
    let publicBasePath = '/tmp';
    if (process.env.PUBLIC_OBJECT_SEARCH_PATHS) {
      try {
        const paths = JSON.parse(process.env.PUBLIC_OBJECT_SEARCH_PATHS);
        if (Array.isArray(paths) && paths.length > 0) {
          publicBasePath = paths[0];
        }
      } catch (e) {
        // If parsing fails, use the value as is
        publicBasePath = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
      }
    }
    
    const publicPath = path.join(publicBasePath, fileName);
    const publicDir = path.join(publicBasePath, folder);
    
    // Write file to public directory
    const fs = await import('fs/promises');
    await fs.mkdir(publicDir, { recursive: true });
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