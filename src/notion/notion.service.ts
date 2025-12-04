/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  CreatePageParameters,
} from '@notionhq/client/build/src/api-endpoints';

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
  }) {
    try {
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
      };

      if (data.apps) {
        properties.Apps = {
          rich_text: [{ text: { content: data.apps } }],
        };
      }

      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties,
      });

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
}
