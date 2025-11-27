/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/tickets/tickets.controller.ts — versi MINIMAL

import { Controller, Post, Body } from '@nestjs/common';
import { NotionService } from '../notion/notion.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly notionService: NotionService) {}

  @Post()
  async createTicket(@Body() body: any) {
    console.log('📥 Received:', body);

    // Minimal required: subject, messages, email, type
    const { email, subject, messages, type = 'Support' } = body;

    if (!email || !subject || !messages) {
      return {
        statusCode: 400,
        message: 'Missing required: email, subject, messages',
      };
    }

    try {
      const result = await this.notionService.createTicket({
        email,
        subject,
        messages,
        type, // ← sekarang minimal 'Support' jika tidak dikirim
      });

      return {
        statusCode: 201,
        message: '✅ Ticket created!',
        data: { id: result.id, url: result.url },
      };
    } catch (error) {
      console.error('❌ Error:', error.message);
      return {
        statusCode: 500,
        message: 'Failed to create ticket',
        error: error.message,
      };
    }
  }
}
