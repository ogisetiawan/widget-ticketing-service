import { IsObject, IsOptional, IsNumber, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTicketsDto {
  @IsOptional()
  @IsObject()
  filter?: Record<string, any>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page_size?: number;

  @IsOptional()
  @IsArray()
  sorts?: any[];

  @IsOptional()
  @IsString()
  start_cursor?: string;
}
