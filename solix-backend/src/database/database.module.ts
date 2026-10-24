import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { models } from './schemas';
@Global()
@Module({
  imports: [MongooseModule.forFeature(models)],
  exports: [MongooseModule],
})
export class DatabaseModule {}
