import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { NotionModule } from '../notion/notion.module';

@Module({
  imports: [NotionModule],
  controllers: [TicketsController],
})
export class TicketsModule {}
