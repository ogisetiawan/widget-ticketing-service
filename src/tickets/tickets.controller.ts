/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { NotionService } from '../notion/notion.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';

@Controller('bm-ticketing/tickets')
export class TicketsController {
  constructor(private readonly notionService: NotionService) {}

  /**
   * GET bm-ticketing/tickets
   * List tickets/pages from default database
   */
  @Get()
  async listTickets(
    @Query('page_size') pageSize?: string,
    @Query('start_cursor') startCursor?: string,
  ) {
    const query: Record<string, unknown> = {};

    if (pageSize) {
      const size = Number(pageSize);
      if (Number.isNaN(size) || size < 1 || size > 100) {
        throw new HttpException(
          'page_size must be a number between 1 and 100',
          HttpStatus.BAD_REQUEST,
        );
      }
      query.page_size = size;
    }

    if (startCursor) {
      query.start_cursor = startCursor;
    }

    try {
      const result = await this.notionService.getPagesFromDatabase(
        undefined,
        query,
      );

      return {
        statusCode: 200,
        message: 'Tickets retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve tickets',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET bm-ticketing/tickets/query
   * Query tickets/pages by filter (body)
   */
  @Get('query')
  async queryTickets(@Body() body: QueryTicketsDto) {
    const query: Record<string, unknown> = {};

    if (body?.filter) {
      query.filter = body.filter;
    }

    if (body?.page_size) {
      query.page_size = body.page_size;
    }

    try {
      const result = await this.notionService.getPagesFromDatabase(
        undefined,
        query,
      );

      return {
        statusCode: 200,
        message: 'Tickets retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve tickets by query',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET bm-ticketing/tickets/:pageId
   * Retrieve ticket/page details by page ID
   */
  @Get(':pageId')
  async getTicketById(@Param('pageId') pageId: string) {
    if (!pageId) {
      throw new HttpException('pageId is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const page = await this.notionService.getPage(pageId);
      return {
        statusCode: 200,
        message: 'Ticket retrieved successfully',
        data: page,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve ticket',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST bm-ticketing/tickets
   * Create a new ticket/page
   */
  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto) {
    try {
      const result = await this.notionService.createTicket({
        email: createTicketDto.email,
        subject: createTicketDto.subject,
        messages: createTicketDto.messages,
        type: createTicketDto.type as
          | 'Bug Report'
          | 'Support'
          | 'Feature Request',
        apps: createTicketDto.apps,
      });

      return {
        statusCode: 201,
        message: 'Ticket created successfully',
        data: { id: result.id, url: result.url },
      };
    } catch (error: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to create ticket',
          error: error?.message || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
