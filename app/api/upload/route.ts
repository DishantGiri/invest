import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login to upload files.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file format. Please upload PNG, JPG, WEBP, or SVG images.' }, { status: 400 });
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(file.name) || '.png';
    const sanitizedBase = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedBase}_${Date.now()}${fileExt}`;

    let publicUrl = '';

    // Attempt to write file to local public/uploads directory (works in standard Node.js server)
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, buffer);
      publicUrl = `/uploads/${filename}`;
    } catch (fsError) {
      // In serverless / read-only environment (such as Vercel), fall back to Base64 Data URL
      console.warn('Filesystem write unavailable (read-only environment). Converting upload to Base64 Data URL:', fsError);
      const mimeType = file.type || 'image/png';
      const base64Data = buffer.toString('base64');
      publicUrl = `data:${mimeType};base64,${base64Data}`;
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully!',
      url: publicUrl,
      filename
    });
  } catch (error: any) {
    console.error('File Upload Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image' }, { status: 500 });
  }
}

