import { Body, Controller, Get, Post, UseGuards, Param } from "@nestjs/common";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { Public, Roles } from "src/infrastructure/auth/public.decorator";
import { Role } from "src/shared/domain/enums/user-role.enum.js";
import { SyncClientFromKeycloakUseCase } from "src/application/uses-cases/clients/sync-client-from-keycloak.use-case";
import { SyncProviderFromKeycloakUseCase } from "src/application/uses-cases/providers/sync-provider-from-keycloak.use-case";
@UseGuards()
@Controller("keycloak/")
export class UsersController {
  constructor(
    private readonly keycloak: KeycloakAdminService,
    private readonly syncClientUseCase: SyncClientFromKeycloakUseCase,
    private readonly syncProviderUseCase: SyncProviderFromKeycloakUseCase
  ) {}
  //create user using keylaock REST APIs
  @Public()
  @Post('users')
  async createUser(
    @Body()
    body: { 
      username: string; 
      email: string; 
      password: string;
      userType?: 'client' | 'provider' | 'admin';
      services?: string[];
    }
  ) {
    // Step 1: Create user in Keycloak
    const keycloakUser = await this.keycloak.createUser(body);
    
    // Step 2: Sync user to local database if userType is provided
    if (body.userType && (body.userType === 'client' || body.userType === 'provider')) {
      try {
        if (body.userType === 'client') {
          await this.syncClientUseCase.execute({
            id: keycloakUser.id,
            keycloakUserId: keycloakUser.id,
            email: keycloakUser.email,
            name: body.username,
            phoneNumber: undefined,
            address: undefined
          });
          console.log(`Client ${body.email} synced to database`);
        } else if (body.userType === 'provider') {
          await this.syncProviderUseCase.execute({
            id: keycloakUser.id,
            keycloakUserId: keycloakUser.id,
            email: keycloakUser.email,
            name: body.username,
            services: body.services || []
          });
          console.log(`Provider ${body.email} synced to database`);
        }
      } catch (syncError) {
        console.error('Error syncing user to database:', syncError);
        // Don't fail the registration, just log the error
      }
    }
    
    return { 
      message: "User created successfully",
      user: keycloakUser
    };
  }
  //get admin token using keycloak REST APIs
  @Roles('admin')
  @Post('token')
  async getToken() {
    console.log("Getting admin token...");
    return { token: await this.keycloak.getAdminToken() };
  }
  //create role using keycloak REST APIs
  @Public()
  @Post('roles')
  async createRole(
    @Body()
    body: { roleName: string }
  ) {
    return await this.keycloak.createRole(body.roleName);
  }

  //assign role to user using keycloak REST APIs

  @Public()
  @Post('assign-role')
  async assignRoleToUser(
    @Body()
    body: { username: string; roleName: string }
  ) {
    return await this.keycloak.assignRoleToUser(body.username, body.roleName);
  }

  //get users using keycloak REST APIs
  @Public()
  @Get('users')
  async getUsers() {
    return await this.keycloak.getUsers();
  }

  //get roles using keycloak REST APIs

  @Public()
  @Get('roles')
  async getRoles() {
    return await this.keycloak.getRoles();
  }
}
