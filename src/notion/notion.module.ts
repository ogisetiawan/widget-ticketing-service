import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';

@Module({
  imports: [ConfigModule],
  controllers: [NotionController],
  providers: [
    {
      provide: 'NOTION_API_KEY',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('NOTION_API_KEY');
        if (!apiKey) {
          console.warn('⚠️ NOTION_API_KEY is not set in environment variables');
        }
        return apiKey;
      },
      inject: [ConfigService],
    },
    {
      provide: 'NOTION_DATABASE_ID',
      useFactory: (configService: ConfigService) => {
        return configService.get<string>('NOTION_DATABASE_ID');
      },
      inject: [ConfigService],
    },
    NotionService,
  ],
  exports: [NotionService], // agar bisa dipakai module lain
})
export class NotionModule {}
