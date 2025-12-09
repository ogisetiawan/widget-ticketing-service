/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  CreatePageParameters,
} from '@notionhq/client/build/src/api-endpoints';

// Type for uploaded file
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

type NotionDatabaseQueryParameters = {
  database_id: string;
  filter?: any;
  sorts?: any[];
  start_cursor?: string;
  page_size?: number;
};

type NotionDataSourceQueryParameters = {
  data_source_id: string;
  filter?: any;
};

type NotionDatabaseQueryResponse = {
  results: (PageObjectResponse | PartialPageObjectResponse)[];
  has_more: boolean;
  next_cursor: string | null;
};

@Injectable()
export class NotionService {
  private notion: Client;
  notionWithQuery: any;

  constructor(
    @Inject('NOTION_API_KEY') private readonly apiKey: string,
    @Inject('NOTION_DATABASE_ID') private readonly databaseId: string,
    @Inject('NOTION_DATASOURCE_ID') private readonly dataSourceId : string,
  ) {
    if (!this.apiKey) {
      throw new Error(
        'NOTION_API_KEY is required. Please set it in your .env file.',
      );
    }
    this.notion = new Client({ auth: this.apiKey });
  }

  async createTicket(data: {
    email: string; // Wajib — dari form
    subject: string; // Wajib — judul ticket
    user: string; // Wajib — rich text
    messages: string; // Wajib — deskripsi
    type: 'Bug Report' | 'Support' | 'Feature Request'; // Wajib — select
    apps?: string; // Opsional — rich text
    files?: UploadedFile[]; // Opsional — array of uploaded files
  }) {
    try {
      const ticketId = this.generateTicketId();
      
      const properties: CreatePageParameters['properties'] = {
        Subject: {
          title: [{ text: { content: data.subject } }],
        },
        User: {
          rich_text: [{ text: { content: data.user } }],
        },
        Messages: {
          rich_text: [{ text: { content: data.messages } }],
        },
        Email: {
          email: data.email,
        },
        Type: {
          select: { name: data.type },
        },
        'ID Ticket': {
          rich_text: [{ text: { content: ticketId } }],
        },
      };

      if (data.apps) {
        properties.Apps = {
          rich_text: [{ text: { content: data.apps } }],
        };
      }

      // Create page first
      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties,
      });

      // If there are files, upload them to Notion and add to page
      if (data.files && data.files.length > 0) {
        try {
          // Upload files directly to Notion using File Upload API
          const notionFiles = await this.uploadFilesToNotion(data.files);
          
          // Update page with files in property
          if (notionFiles.length > 0) {
            try {
              // Format files for Notion property
              const formattedFiles = notionFiles.map((file) => {
                if (file.file_upload) {
                  return {
                    name: file.name,
                    type: 'file_upload',
                    file_upload: file.file_upload,
                  };
                } else if (file.external) {
                  return {
                    name: file.name,
                    type: 'external',
                    external: file.external,
                  };
                }
                return null;
              }).filter((f) => f !== null);

              if (formattedFiles.length > 0) {
                await this.notion.pages.update({
                  page_id: response.id,
                  properties: {
                    Attachments: {
                      files: formattedFiles as any,
                    },
                  },
                });
              }
            } catch (updateError) {
              console.error('Error updating page with files property:', updateError);
              // Fallback: Add files as blocks
              await this.addFilesAsPageAttachments(response.id, data.files);
            }
          }
        } catch (fileError) {
          console.error('Error uploading files to Notion:', fileError);
          // Fallback: Add files as blocks
          try {
            await this.addFilesAsPageAttachments(response.id, data.files);
            await this.addFilesAsPageAttachments(response.id, data.files);
          } catch (blockError) {
            console.error('Error adding files as blocks:', blockError);
          }
        }
      }

      const responseWithUrl = response as { url?: string };

      return {
        id: response.id,
        url: responseWithUrl.url,
        success: true,
      };
    } catch (error) {
      console.error('Notion API Error:', error);
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  /**
   * Get a single page by page ID
   * @param pageId - The ID of the page to retrieve
   * @returns Page object from Notion
   */
  async getPage(
    pageId: string,
  ): Promise<PageObjectResponse | PartialPageObjectResponse> {
    try {
      const response = await this.notion.pages.retrieve({ page_id: pageId });
      return response;
    } catch (error: any) {
      console.error('Notion API Error:', error);
      throw new Error(
        `Failed to get page: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get list of pages from a database with optional query
   * @param databaseId - The ID of the database to query
   * @param query - Optional query parameters (filter, sorts, etc.)
   * @returns List of pages from the database
   */
  async getPagesFromDatabase(
    databaseId = this.databaseId,
    query?: {
      filter?: any;
      sorts?: any[];
      start_cursor?: string;
      page_size?: number;
    },
  ) {
    try {
      const queryParams: NotionDatabaseQueryParameters = {
        database_id: databaseId,
      };

      if (query?.filter) {
        queryParams.filter = query.filter;
      }

      if (query?.sorts) {
        queryParams.sorts = query.sorts;
      }

      if (query?.start_cursor) {
        queryParams.start_cursor = query.start_cursor;
      }

      if (query?.page_size) {
        queryParams.page_size = query.page_size;
      }

      const notionWithQuery = this.notion as Client & {
        databases: Client['databases'] & {
          query: (
            args: NotionDatabaseQueryParameters,
          ) => Promise<NotionDatabaseQueryResponse>;
        };
      };

      const response = await notionWithQuery.databases.query(queryParams);
      return {
        results: response.results,
        has_more: response.has_more,
        next_cursor: response.next_cursor,
      };
    } catch (error: any) {
      console.error('Notion API Error:', error);
      throw new Error(
        `Failed to get pages from database: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  async getPagesFromDataSourceNotionExample(dataSourceId: string) {
    // This query will filter and sort database entries. The returned pages will have a
    // "Last ordered" property that is more recent than 2022-12-31. Any database property
    // can be filtered or sorted. Pass multiple sort objects to the "sorts" array to
    // apply more than one sorting rule.
    const lastOrderedIn2023Alphabetical = await this.notion.dataSources.query({
      data_source_id: this.dataSourceId,
      filter: {
        property: "Email",
        email: {
          "equals": "ogi@example.com"
        },
      },
    })
  
    // Print filtered/sorted results
    console.log(
      'Pages with the "Last ordered" date after 2022-12-31 in descending order:'
    )
    console.log(JSON.stringify(lastOrderedIn2023Alphabetical, null, 2))
    return lastOrderedIn2023Alphabetical;
  }

  /**
 * Get list of pages from a Data Source using data_source_id
 * @param dataSourceId - Notion Data Source ID
 * @param query - Optional filters, sorts, pagination
 */
  async getPagesFromDataSource(
    dataSourceId: string,
    query?: {
      filter?: any;
      sorts?: any[];
      start_cursor?: string;
      page_size?: number;
    },
  ) {
    try {
      const params: any = {
        data_source_id: this.dataSourceId,
      };

      if (query?.filter) params.filter = query.filter;
      if (query?.sorts) params.sorts = query.sorts;
      if (query?.start_cursor) params.start_cursor = query.start_cursor;
      if (query?.page_size) params.page_size = query.page_size;

      const response = await this.notion.dataSources.query(params);

      return {
        results: response.results,
        has_more: response.has_more,
        next_cursor: response.next_cursor,
      };
    } catch (error: any) {
      console.error('Notion API Error:', error);
      throw new Error(
        `Failed to get pages from data source: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Get list of pages from a Data Source using data_source_id
   * @param dataSourceId - Notion Data Source ID
   * @param query - Optional filters, sorts, pagination
   */
  async getPagesFromDataSourceQuery(query: any) {
    try {
      const response = await this.notion.dataSources.query({
        data_source_id: this.dataSourceId,
        ...query, // filter, page_size, start_cursor, sorts
      });

      return {
        results: response.results,
        has_more: response.has_more,
        next_cursor: response.next_cursor,
      };
    } catch (error: any) {
      console.error('Notion API Error:', error);
      throw new Error(
        `Failed to get pages from data source: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Create a page in a database
   * @param databaseId - The ID of the database
   * @param properties - The properties for the new page
   * @returns Created page object
   */
  async createPageFromDatabase(
    databaseId = this.databaseId,
    properties: any,
  ): Promise<PageObjectResponse | PartialPageObjectResponse> {
    try {
      const response = await this.notion.pages.create({
        parent: { database_id: databaseId },
        properties: properties,
      });
      return response;
    } catch (error: any) {
      console.error('Notion API Error:', error);
      throw new Error(
        `Failed to create page: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  private generateTicketId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKTBM-${yy}${mm}${dd}-${random}`;
  }

  
  /**
   * Upload files directly to Notion using Notion File Upload API
   * @param files - Array of uploaded files
   * @returns Array of file data for Notion property with file_upload_id
   */
  private async uploadFilesToNotion(
    files: UploadedFile[],
  ): Promise<Array<{ name: string; type: string; file_upload?: { id: string }; external?: { url: string } }>> {
    const https = require('https');
    const FormData = require('form-data');

    const notionFiles = await Promise.all(
      files.map(async (file) => {
        try {
          // Check file size (Notion supports up to 20MB for single-part upload)
          const maxSize = 20 * 1024 * 1024; // 20MB
          if (file.size > maxSize) {
            console.warn(`File ${file.originalname} is too large (${file.size} bytes). Max size is 20MB.`);
            // Fallback to external URL for large files
            return this.createExternalFileUrl(file);
          }

          // Step 1: Create file upload object
          const uploadId = await this.createNotionFileUpload(file);
          
          if (uploadId) {
            // Step 2: Upload file content
            await this.uploadFileContent(uploadId, file);
            
            // Return file with file_upload_id
            return {
              name: file.originalname,
              type: 'file_upload',
              file_upload: {
                id: uploadId,
              },
            };
          } else {
            // Fallback to external URL if upload fails
            return this.createExternalFileUrl(file);
          }
        } catch (error) {
          console.error(`Error uploading file ${file.originalname} to Notion:`, error);
          // Fallback to external URL
          return this.createExternalFileUrl(file);
        }
      }),
    );

    return notionFiles;
  }

  /**
   * Create a file upload object in Notion
   */
  private async createNotionFileUpload(file: UploadedFile): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      
      const postData = JSON.stringify({
        mode: 'single_part',
        name: file.originalname,
      });

      const options = {
        hostname: 'api.notion.com',
        port: 443,
        path: '/v1/file_uploads',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.id) {
              resolve(response.id);
            } else {
              console.error('Failed to create file upload:', response);
              resolve(null);
            }
          } catch (error) {
            console.error('Error parsing file upload response:', error);
            resolve(null);
          }
        });
      });

      req.on('error', (error: Error) => {
        console.error('Error creating file upload:', error);
        resolve(null);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Upload file content to Notion
   */
  private async uploadFileContent(uploadId: string, file: UploadedFile): Promise<void> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const FormData = require('form-data');
      
      const form = new FormData();
      form.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const options = {
        hostname: 'api.notion.com',
        port: 443,
        // Correct endpoint for sending file content to Notion
        path: `/v1/file_uploads/${uploadId}/send`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
          ...form.getHeaders(),
        },
      };

      const req = https.request(options, (res: any) => {
        res.on('data', () => {});
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error: Error) => {
        reject(error);
      });

      form.pipe(req);
    });
  }

    /**
   * Fallback: add files as page property Attachments using external URLs
   */
    async addFilesAsPageAttachments(
      pageId: string,
      files: UploadedFile[],
    ): Promise<void> {
      const fs = require('fs').promises;
      const path = require('path');
      const crypto = require('crypto');
  
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
      // Ensure uploads dir exists
      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }
  
      const attachmentFiles: Array<{
        name: string;
        type: 'external';
        external: { url: string };
      }> = [];
  
      for (const file of files) {
        try {
          const fileExt = path.extname(file.originalname);
          const uniqueName = `${crypto.randomUUID()}${fileExt}`;
          const filePath = path.join(uploadsDir, uniqueName);
          await fs.writeFile(filePath, file.buffer);
  
          attachmentFiles.push({
            name: file.originalname,
            type: 'external',
            external: {
              url: `${baseUrl}/uploads/${uniqueName}`,
            },
          });
        } catch (error) {
          console.error(`Error preparing attachment ${file.originalname}:`, error);
        }
      }
  
      if (attachmentFiles.length > 0) {
        try {
          await this.notion.pages.update({
            page_id: pageId,
            properties: {
              Attachments: {
                files: attachmentFiles as any,
              },
            },
          });
        } catch (error) {
          console.error('Error updating page with attachment files:', error);
        }
      }
    }

  /**
   * Create external file URL as fallback
   */
  private async createExternalFileUrl(file: UploadedFile): Promise<{ name: string; type: string; external: { url: string } }> {
    const fs = require('fs').promises;
    const path = require('path');
    const crypto = require('crypto');

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // Create uploads directory if it doesn't exist
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Save file locally
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${crypto.randomUUID()}${fileExt}`;
    const filePath = path.join(uploadsDir, uniqueName);
    await fs.writeFile(filePath, file.buffer);

    return {
      name: file.originalname,
      type: 'external',
      external: {
        url: `${baseUrl}/uploads/${uniqueName}`,
      },
    };
  }
}
