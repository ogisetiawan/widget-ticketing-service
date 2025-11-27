/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

@Injectable()
export class NotionService {
  private notion: Client;

  constructor(
    @Inject('NOTION_API_KEY') private readonly apiKey: string,
    @Inject('NOTION_DATABASE_ID') private readonly databaseId: string,
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
    messages: string; // Wajib — deskripsi
    type: 'Bug Report' | 'Support' | 'Feature Request'; // Wajib — select
    apps?: string; // Opsional — select
    assignee?: string; // Opsional — email user
  }) {
    try {
      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          // ⚠️ NAMA PROPERTI HARUS PERSIS SEPERTI DI NOTION!
          Subject: {
            title: [{ text: { content: data.subject } }],
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
          Apps: {
            rich_text: [{ text: { content: data.apps } }], // ← rich_text
          },
          //   Status: {
          //     select: { name: 'New' }, // status default
          //   },
        },
        // Jika ingin tambahkan file, gunakan block API — tapi lebih kompleks
        // Untuk sekarang, biarkan kosong — user bisa upload manual setelah ticket dibuat
      });

      return {
        id: response.id,
        url: response,
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
    databaseId: string,
    query?: {
      filter?: any;
      sorts?: any[];
      start_cursor?: string;
      page_size?: number;
    },
  ) {
    try {
      const queryParams: any = {
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

      // Use the correct method from Notion Client
      // Note: TypeScript types may not include query method, but it exists in runtime
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const response = await (this.notion.databases as any).query(queryParams);
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

  /**
   * Create a page in a database
   * @param databaseId - The ID of the database
   * @param properties - The properties for the new page
   * @returns Created page object
   */
  async createPageFromDatabase(
    databaseId: string,
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
    return `TKT-${yy}${mm}${dd}-${random}`;
  }
}
