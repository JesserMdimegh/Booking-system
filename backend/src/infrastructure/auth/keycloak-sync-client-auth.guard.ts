import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { SyncClientFromKeycloakUseCase } from '../../application/uses-cases/clients/sync-client-from-keycloak.use-case';

@Injectable()
export class KeycloakSyncClientAuthGuard extends AuthGuard('keycloak') {
  constructor(
    private reflector: Reflector,
    private syncClientUseCase: SyncClientFromKeycloakUseCase,
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
          // Sync client to local database
          if (user.roles && user.roles.includes('CLIENT')) {
            await this.syncClientUseCase.execute({
              id: user.userId,
              keycloakUserId: user.userId,
              email: user.email,
              name: user.username || user.email,
              phoneNumber: undefined,
              address: undefined
            });
            console.log(`Client ${user.email} synced to database`);
          }
        } catch (error) {
          console.error('Error syncing client to database:', error);
          // Don't block authentication, just log the error
        }
      }
    }

    return result as boolean;
  }
}
