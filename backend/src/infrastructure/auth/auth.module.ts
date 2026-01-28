// src/infrastructure/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { KeycloakStrategy } from './keyclock.strategy';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakAuthGuard } from './keyclock.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'keycloak' })],
  providers: [
    KeycloakStrategy,
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
  ],
  exports: [PassportModule],
})
export class AuthModule {}