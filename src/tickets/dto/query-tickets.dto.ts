import { IsObject, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTicketsDto {
  @IsOptional()
  @IsObject()
  filter?: Record<string, any>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page_size?: number;
  sorts?: any;
  start_cursor?: any;
}

