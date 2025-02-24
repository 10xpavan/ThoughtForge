import { google } from 'googleapis';

const FOLDER_NAME = 'Journal Entries';

export interface GoogleDriveService {
  uploadFile: (title: string, content: string) => Promise<{ id: string }>;
  shareFile: (fileId: string) => Promise<{ webViewLink: string }>;
}

export class GoogleDriveService {
  private drive;
  private folderId: string | null = null;

  constructor(accessToken: string) {
    this.drive = google.drive({
      version: 'v3',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async initializeFolder() {
    if (this.folderId) return this.folderId;

    // Search for existing folder
    const response = await this.drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`,
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      this.folderId = response.data.files[0].id!;
    } else {
      // Create new folder
      const folderMetadata = {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      this.folderId = folder.data.id!;
    }

    return this.folderId;
  }

  async saveEntry(entry: any) {
    const folderId = await this.initializeFolder();
    
    const fileMetadata = {
      name: `${entry.title}.json`,
      parents: [folderId],
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(entry),
    };

    if (entry.fileId) {
      // Update existing file
      await this.drive.files.update({
        fileId: entry.fileId,
        requestBody: fileMetadata,
        media: media,
      });
    } else {
      // Create new file
      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });
      return file.data.id;
    }
  }

  async getEntry(fileId: string) {
    const file = await this.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    return file.data;
  }
} 