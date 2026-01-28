import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { SyncProviderFromKeycloakUseCase } from '../../application/uses-cases/providers/sync-provider-from-keycloak.use-case';

@Injectable()
export class KeycloakSyncProviderAuthGuard extends AuthGuard('keycloak') {
  constructor(
    private reflector: Reflector,
    private syncProviderUseCase: SyncProviderFromKeycloakUseCase,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const result = await super.canActivate(context);
    
    if (result) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      
      if (user && user.userId) {
        try {
          // Sync provider to local database
          if (user.roles && user.roles.includes('PROVIDER')) {
            await this.syncProviderUseCase.execute({
              id: user.userId,
              keycloakUserId: user.userId,
              email: user.email,
              name: user.username || user.email,
              services: []
            });
            console.log(`Provider ${user.email} synced to database`);
          }
        } catch (error) {
          console.error('Error syncing provider to database:', error);
          // Don't block authentication, just log the error
        }
      }
    }

    return result as boolean;
  }
}
