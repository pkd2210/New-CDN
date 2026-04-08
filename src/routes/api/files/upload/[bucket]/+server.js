import { auth } from '$lib/server/auth'; // Better-auth instance
import { db } from '$lib/server/db'; // Drizzle ORM instance
import { files, buckets, fileData } from '$lib/server/db/schema'; // Drizzle ORM schema for files and buckets
import { eq } from 'drizzle-orm'; // Drizzle ORM helper for equality checks
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasBucketAccess, isAdminUser } from '$lib/server/permissions';

export async function GET({ params }) {
    return new Response("GET requests are not supported for file uploads", { status: 405 });
}

export async function POST({ params, request }) {
    env; // Ensure env variables are loaded
    // get bucket name from dynamic route
    const { bucket } = params;
    
    // Check if user is authenticated thorugh better auth
    const session = await auth.api.getSession({
        headers: request.headers
    });
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }
    const isAdmin = await isAdminUser(session.user.id);

    // Check if bucket exists
    const [bucketExists] = await db.select().from(buckets).where(eq(buckets.name, bucket)).limit(1);
    if (!bucketExists) {
        return new Response('Bucket not found', { status: 404 });
    }
    // Check if user has access to upload to this bucket
    if (!hasBucketAccess(bucketExists, session.user.id, isAdmin)) {
        return new Response('Access denied', { status: 403 });
    }
    // get file from request
    const formData = await request.formData();
    const file = formData.get('file');
    
    // Check if file is present in the request
    if (!file) {
        return new Response('No file uploaded', { status: 400 });
    }
    // check if file with the same name already exists in the bucket
    let fileName = file.name;
    const [existingFile] = await db.select().from(files).where(eq(files.name, file.name), eq(files.bucket, bucket)).limit(1);
    if (existingFile) {
        fileName = `${Date.now()}_${file.name}`; // Rename the file to avoid conflict
    }
    // check if the file size exceeds the user's remaining storage limit
    const userFiles = await db.select().from(files).where(eq(files.userId, session.user.id));
    const totalStorageUsed = userFiles.reduce((total, file) => total + file.size, 0);
    if (totalStorageUsed + file.size > (bucketExists.sizeLimit)) {
        return new Response('Storage limit exceeded', { status: 400 });
    }
    // Generate a unique ID for the file (you can use a library like uuid)
    const id = crypto.randomUUID();
    const fileBuffer = await file.arrayBuffer();

    // Save the file metadata and data separately
    await db.insert(files).values({
        id,
        bucket,
        userId: session.user.id, // Use the authenticated user's ID
        name: fileName,
        mimeType: file.type,
        size: file.size,
    });

    // Save the file data separately
    await db.insert(fileData).values({
        fileId: id,
        data: fileBuffer,
    });

    return new Response(JSON.stringify({
        message: 'File uploaded successfully',
        link: `${env.ORIGIN}/${bucket}/${fileName}`,
        fileName,
        bucket,
        mimeType: file.type,
        size: file.size,
        remainingStorage: bucketExists.sizeLimit - (totalStorageUsed + file.size)
    }), {
        headers: { 'Content-Type': 'application/json' },
        status: 201
    });
}