import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
          port: Number(configService.get<string>('MAIL_PORT') || 465),
          secure: true,
          auth: {
            user: configService.get<string>('MAIL_USER') || '',
            pass: configService.get<string>('MAIL_PASS') || '',
          },
        },
        defaults: {
          from:
            configService.get<string>('MAIL_FROM') ||
            configService.get<string>('MAIL_USER') ||
            'no-reply@solix.com',
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
