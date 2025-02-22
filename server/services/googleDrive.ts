import { google } from 'googleapis';

const FOLDER_NAME = 'Journal Entries';

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

    try {
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
    } catch (error) {
      console.error('Error initializing folder:', error);
      throw error;
    }
  }

  async saveEntry(entry: any) {
    try {
      const folderId = await this.initializeFolder();
      
      const fileMetadata = {
        name: `${entry.title}.json`,
        parents: [folderId],
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(entry),
      };

      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink',
      });

      return file.data;
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  }

  async listEntries() {
    try {
      const folderId = await this.initializeFolder();
      
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id, name, webViewLink, createdTime)',
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listing entries:', error);
      throw error;
    }
  }
}
