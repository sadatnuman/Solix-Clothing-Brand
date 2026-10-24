import type { Response } from 'express';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { mongo } from 'mongoose';
@Catch(mongo.MongoServerError)
export class DatabaseFilter implements ExceptionFilter {
  catch(error: mongo.MongoServerError, host: ArgumentsHost) {
    const duplicate = error.code === 11000;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(duplicate ? 409 : 503)
      .json({
        statusCode: duplicate ? 409 : 503,
        message: duplicate
          ? 'This record already exists.'
          : 'Database operation could not be completed. Please retry.',
      });
  }
}
