// src/infrastructure/auth/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from './roles.guard';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

