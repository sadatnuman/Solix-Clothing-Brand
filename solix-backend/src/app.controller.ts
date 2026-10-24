import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
@Controller()
export class AppController {
  constructor(
    private readonly config: ConfigService,
    @InjectConnection() private readonly db: Connection,
  ) {}
  @Get() health() {
    return { status: 'ok', service: 'Solix API' };
  }
  @Get('store/config') configPublic() {
    return {
      data: {
        currency: 'BDT',
        shippingAmount: 0,
        paymentMethods: [
          { id: 'cash_on_delivery', label: 'Cash on delivery', enabled: true },
          ...['bkash', 'nagad'].map((id) => ({
            id,
            label: id === 'bkash' ? 'bKash' : 'Nagad',
            enabled: Boolean(
              this.config.get<string>(`${id.toUpperCase()}_NUMBER`),
            ),
            number:
              this.config.get<string>(`${id.toUpperCase()}_NUMBER`) || null,
          })),
        ],
      },
    };
  }
  @Get('ready') readiness() {
    const connected = String(this.db.readyState) === '1';
    return {
      status: connected ? 'ready' : 'not_ready',
      database: connected ? 'connected' : 'disconnected',
    };
  }
}
