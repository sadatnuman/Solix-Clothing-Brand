import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isObjectIdOrHexString } from 'mongoose';
@Injectable()
export class ObjectIdPipe implements PipeTransform {
  transform(value: string) {
    if (!isObjectIdOrHexString(value))
      throw new BadRequestException('Invalid identifier');
    return value;
  }
}
