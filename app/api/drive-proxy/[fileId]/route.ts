import {google} from 'googleapis';
import {NextResponse} from 'next/server';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
});

const drive = google.drive({version: 'v3', auth});

export async function GET(
    req: Request,
    {params}: { params: Promise<{ fileId: string }> }
) {
    try {
        const {fileId} = await params;

        const response = await drive.files.get(
            {fileId, alt: 'media'},
            {responseType: 'stream'}
        );

        // Get metadata to set correct Content-Type
        const metadata = await drive.files.get({
            fileId,
            fields: 'mimeType'
        });

        return new NextResponse(response.data as any, {
            headers: {
                'Content-Type': metadata.data.mimeType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        console.error('Drive proxy error:', error);
        return NextResponse.json({error: 'Failed to fetch image from Google Drive'}, {status: 500});
    }
}
