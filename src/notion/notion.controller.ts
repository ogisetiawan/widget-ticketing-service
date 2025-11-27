/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { NotionService } from './notion.service';

@Controller('notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  /**
   * GET /notion/pages/:pageId
   * Get a single page from Notion by page ID
   */
  @Get('pages/:pageId')
  async getPage(@Param('pageId') pageId: string) {
    try {
      if (!pageId) {
        throw new HttpException('Page ID is required', HttpStatus.BAD_REQUEST);
      }

      const page = await this.notionService.getPage(pageId);

      return {
        statusCode: 200,
        message: 'Page retrieved successfully',
        data: page,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve page',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /notion/databases/:databaseId/pages
   * Get list of pages from a database with optional query parameters
   * Query params:
   * - filter: JSON string of filter object
   * - sorts: JSON string of sorts array
   * - start_cursor: Pagination cursor
   * - page_size: Number of results per page (max 100)
   */
  @Get('databases/:databaseId/pages')
  async getPagesFromDatabase(
    @Param('databaseId') databaseId: string,
    @Query('filter') filter?: string,
    @Query('sorts') sorts?: string,
    @Query('start_cursor') startCursor?: string,
    @Query('page_size') pageSize?: string,
  ) {
    try {
      if (!databaseId) {
        throw new HttpException(
          'Database ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Parse query parameters
      const query: any = {};

      if (filter) {
        try {
          query.filter = JSON.parse(filter);
        } catch {
          throw new HttpException(
            'Invalid filter JSON format',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (sorts) {
        try {
          query.sorts = JSON.parse(sorts);
        } catch {
          throw new HttpException(
            'Invalid sorts JSON format',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (startCursor) {
        query.start_cursor = startCursor;
      }

      if (pageSize) {
        const size = parseInt(pageSize, 10);
        if (isNaN(size) || size < 1 || size > 100) {
          throw new HttpException(
            'page_size must be a number between 1 and 100',
            HttpStatus.BAD_REQUEST,
          );
        }
        query.page_size = size;
      }

      const result = await this.notionService.getPagesFromDatabase(
        databaseId,
        query,
      );

      return {
        statusCode: 200,
        message: 'Pages retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve pages from database',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /notion/databases/:databaseId/pages
   * Create a new page in a database
   * Body: { properties: { ... } }
   */
  @Post('databases/:databaseId/pages')
  async createPageFromDatabase(
    @Param('databaseId') databaseId: string,
    @Body() body: { properties: any },
  ) {
    try {
      if (!databaseId) {
        throw new HttpException(
          'Database ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!body || !body.properties) {
        throw new HttpException(
          'Properties are required in request body',
          HttpStatus.BAD_REQUEST,
        );
      }

      const page = await this.notionService.createPageFromDatabase(
        databaseId,
        body.properties,
      );

      return {
        statusCode: 201,
        message: 'Page created successfully',
        data: page,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to create page',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
