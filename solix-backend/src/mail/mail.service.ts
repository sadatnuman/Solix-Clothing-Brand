import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(dto: SendMailDto) {
    try {
      await this.mailerService.sendMail({
        from:
          this.configService.get<string>('MAIL_FROM') ||
          this.configService.get<string>('MAIL_USER') ||
          'no-reply@solix.com',
        to: dto.to,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
      });

      return {
        message: 'Email sent successfully',
        data: {
          to: dto.to,
          subject: dto.subject,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendOrderConfirmationEmail(params: {
    to: string;
    customerName: string;
    orderNumber: string;
    totalAmount: number;
  }) {
    const subject = `Order Confirmation - ${params.orderNumber}`;

    const text = `Hello ${params.customerName},

Thank you for shopping with Solix.

Your order has been placed successfully.

Order Number: ${params.orderNumber}
Total Amount: ${params.totalAmount}

We will update you once your order status changes.

Regards,
Solix`;

    const html = `
      <h2>Hello ${params.customerName},</h2>
      <p>Thank you for shopping with <strong>Solix</strong>.</p>
      <p>Your order has been placed successfully.</p>
      <p><strong>Order Number:</strong> ${params.orderNumber}</p>
      <p><strong>Total Amount:</strong> ${params.totalAmount}</p>
      <p>We will update you once your order status changes.</p>
      <br />
      <p>Regards,<br />Solix</p>
    `;

    return this.sendMail({
      to: params.to,
      subject,
      text,
      html,
    });
  }

  async sendOrderStatusUpdateEmail(params: {
    to: string;
    customerName: string;
    orderNumber: string;
    orderStatus: string;
  }) {
    const subject = `Order Status Updated - ${params.orderNumber}`;

    const text = `Hello ${params.customerName},

Your order status has been updated.

Order Number: ${params.orderNumber}
New Status: ${params.orderStatus}

Thank you for shopping with Solix.

Regards,
Solix`;

    const html = `
      <h2>Hello ${params.customerName},</h2>
      <p>Your order status has been updated.</p>
      <p><strong>Order Number:</strong> ${params.orderNumber}</p>
      <p><strong>New Status:</strong> ${params.orderStatus}</p>
      <p>Thank you for shopping with <strong>Solix</strong>.</p>
      <br />
      <p>Regards,<br />Solix</p>
    `;

    return this.sendMail({
      to: params.to,
      subject,
      text,
      html,
    });
  }
}
