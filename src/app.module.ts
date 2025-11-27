import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketsModule } from './tickets/tickets.module';
import { NotionModule } from './notion/notion.module';

//? initial module akan digunakan
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TicketsModule,
    NotionModule,
  ],
  controllers: [AppController],
  providers: [AppService], //?
})
export class AppModule {}
