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
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { NotionService } from '../notion/notion.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { HmacGuard } from '../common/guards/hmac.guard';

// Type for uploaded file
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
@UseGuards(HmacGuard)
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
   * POST bm-ticketing/tickets/query
   * Body filter Email
   */
  @Post('query')
  async getTicketsByQuery(@Body() body: any) {
    if (!body || typeof body !== 'object') {
      throw new HttpException(
        'Request body JSON is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.notionService.getPagesFromDataSourceQuery(body);

    return {
      statusCode: 200,
      message: 'Query success',
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
   * Create a new ticket/page with file upload support
   */
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  async createTicket(
    @Body() createTicketDto: CreateTicketDto,
    @UploadedFiles() files?: UploadedFile[],
  ) {
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
        files: files || [],
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
