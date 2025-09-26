import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateUser } from './_lib/auth';
import busboy from 'busboy';

// Configure for Vercel's body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userPayload = await authenticateUser(req);
    
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse multipart form data
    const bb = busboy({ headers: req.headers });
    const files: Buffer[] = [];
    const filePromises: Promise<void>[] = [];

    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      
      // Validate file type
      if (!mimeType.startsWith('image/')) {
        return res.status(400).json({ message: 'Only image files are allowed' });
      }

      // Collect file data
      const chunks: Buffer[] = [];
      const filePromise = new Promise<void>((resolve, reject) => {
        file.on('data', (data) => {
          chunks.push(data);
        });
        
        file.on('end', () => {
          const fileBuffer = Buffer.concat(chunks);
          files.push(fileBuffer);
          resolve();
        });
        
        file.on('error', reject);
      });
      
      filePromises.push(filePromise);
    });

    bb.on('finish', async () => {
      try {
        await Promise.all(filePromises);
        
        // Convert files to base64 for storage
        // In a real deployment, you'd upload to cloud storage (AWS S3, Vercel Blob, etc.)
        const imageUrls = files.map((file, index) => {
          const base64 = file.toString('base64');
          const dataUrl = `data:image/jpeg;base64,${base64}`;
          return dataUrl;
        });

        res.status(200).json({
          success: true,
          images: imageUrls
        });
      } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({ message: 'File processing failed' });
      }
    });

    bb.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    });

    req.pipe(bb);

  } catch (error) {
    console.error('Upload API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}