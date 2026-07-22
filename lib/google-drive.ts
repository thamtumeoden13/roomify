import {google} from 'googleapis';
import {Readable} from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
});

const drive = google.drive({version: 'v3', auth: oauth2Client});

/**
 * Downloads a file from Google Drive as a Buffer.
 */
export async function downloadFromDrive(fileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
        const response = await drive.files.get({
            fileId: fileId,
            alt: 'media',
        }, {responseType: 'arraybuffer'});

        return {
            buffer: Buffer.from(response.data as ArrayBuffer),
            mimeType: response.headers['content-type'] || 'image/png',
        };
    } catch (error) {
        console.error('Error downloading from Google Drive:', error);
        throw error;
    }
}

/**
 * Uploads a file to Google Drive and sets public view permission.
 * Returns the webViewLink or a direct link.
 */
export async function uploadToDrive(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folderId: string = process.env.GOOGLE_DRIVE_FOLDER_ID!
) {
    try {
        const fileMetadata = {
            name: filename,
            parents: folderId ? [folderId] : [],
        };

        const media = {
            mimeType: mimeType,
            body: Readable.from(buffer),
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        const fileId = file.data.id;

        if (!fileId) {
            throw new Error('Failed to create file on Google Drive');
        }

        // Set permission to 'anyone with the link can view'
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return {
            id: fileId,
            webViewLink: file.data.webViewLink,
            webContentLink: file.data.webContentLink,
        };
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        throw error;
    }
}
