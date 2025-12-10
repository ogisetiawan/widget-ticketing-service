import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { NotionModule } from '../notion/notion.module';
import { HmacGuard } from '../common/guards/hmac.guard';

@Module({
  imports: [NotionModule],
  controllers: [TicketsController],
  providers: [HmacGuard],
})
export class TicketsModule {}
