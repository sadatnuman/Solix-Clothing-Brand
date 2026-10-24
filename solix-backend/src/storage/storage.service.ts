import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

export interface StoredImage {
  url: string;
  publicId?: string;
  localPath?: string;
}

@Injectable()
export class StorageService {
  private readonly provider: 'local' | 'cloudinary';

  constructor(private readonly config: ConfigService) {
    this.provider =
      this.config.get<string>('UPLOAD_PROVIDER') === 'cloudinary'
        ? 'cloudinary'
        : 'local';

    if (this.provider === 'cloudinary') {
      cloudinary.config({
        cloud_name: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
        api_secret: this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
        secure: true,
      });
    }
  }

  imageExtension(bytes: Buffer) {
    if (
      bytes.length > 3 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255
    )
      return 'jpg';
    if (
      bytes.length > 8 &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      return 'png';
    if (
      bytes.length > 12 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    )
      return 'webp';
    throw new BadRequestException(
      'Only genuine JPEG, PNG and WebP images are supported',
    );
  }

  async storeImage(bytes: Buffer, folder: 'products' | 'payments') {
    const extension = this.imageExtension(bytes);
    const id = randomUUID();
    if (this.provider === 'cloudinary') {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: `solix/${folder}`,
            public_id: id,
            format: extension,
            overwrite: false,
          },
          (error, uploaded) => {
            if (error || !uploaded)
              reject(
                error instanceof Error ? error : new Error('Upload failed'),
              );
            else resolve(uploaded);
          },
        );
        stream.end(bytes);
      }).catch(() => {
        throw new InternalServerErrorException(
          'The image could not be stored. Please try again.',
        );
      });
      return { url: result.secure_url, publicId: result.public_id };
    }

    const relative = join('uploads', folder, `${id}.${extension}`);
    const absolute = join(process.cwd(), relative);
    await mkdir(join(process.cwd(), 'uploads', folder), { recursive: true });
    await writeFile(absolute, bytes);
    return { url: relative, localPath: absolute };
  }

  async remove(stored: StoredImage) {
    try {
      if (stored.publicId) {
        await cloudinary.uploader.destroy(stored.publicId, {
          resource_type: 'image',
        });
      } else if (stored.localPath) {
        await unlink(stored.localPath);
      }
    } catch {
      // Cleanup should never hide the database error that caused it.
    }
  }
}
