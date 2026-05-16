import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { SizesModule } from './sizes/sizes.module';
import { ProductsModule } from './products/products.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { PaymentsModule } from './payments/payments.module';
import { MailModule } from './mail/mail.module';
import { OrdersModule } from './orders/orders.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST') ?? 'localhost';
        const dbPort = Number(configService.get<string>('DB_PORT') ?? 5432);
        const dbUsername =
          configService.get<string>('DB_USERNAME') ?? 'postgres';
        const dbPassword = configService.get<string>('DB_PASSWORD') ?? 'root';
        const dbName = configService.get<string>('DB_NAME') ?? 'solix_db';

        return {
          type: 'postgres' as const,
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbName,
          autoLoadEntities: true,
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
        };
      },
    }),

    AuthModule,
    UsersModule,
    CategoriesModule,
    SizesModule,
    ProductsModule,
    ProductVariantsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    AdminDashboardModule,
    MailModule,
  ],
})
export class AppModule {}
