import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export type StaffPermission = 'catalog' | 'fulfilment' | 'support';
export const Permissions = (...permissions: StaffPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
