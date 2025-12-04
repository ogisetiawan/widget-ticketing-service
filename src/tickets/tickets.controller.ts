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
   * Mendapatkan daftar tiket dari dataSourceId tertentu
   */
  @Get()
  async getTickets(
    @Query('page_size') pageSize?: string,
    @Query('start_cursor') startCursor?: string,
    @Body() body?: any, // OPTIONAL Filter
  ) {
    const query: any = {};

    if (pageSize) query.page_size = Number(pageSize);
    if (startCursor) query.start_cursor = startCursor;

    if (body?.filter) query.filter = body.filter;

    const result = await this.notionService.getPagesFromDataSource(query);

    return {
      statusCode: 200,
      message: 'Tickets retrieved successfully',
      data: result,
    };
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
        user: createTicketDto.username,
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
