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
    // Check if user already exists in our database by keycloakUserId
    try {
      // Try to find user by email first (since we don't have keycloakUserId yet)
      if (body.userType === 'client') {
        const existingClient = await this.syncClientUseCase.findByEmail(body.email);
        if (existingClient) {
          console.log(`Client ${body.email} already exists in database`);
          return { 
            message: "User already exists in database",
            user: { email: body.email, userType: body.userType }
          };
        }
      } else if (body.userType === 'provider') {
        const existingProvider = await this.syncProviderUseCase.findByEmail(body.email);
        if (existingProvider) {
          console.log(`Provider ${body.email} already exists in database`);
          return { 
            message: "User already exists in database",
            user: { email: body.email, userType: body.userType }
          };
        }
      }
    } catch (error) {
      console.log('Error checking existing user:', error);
      // Continue with user creation
    }
    
    // Step 1: Create user in Keycloak (this might fail if user already exists in Keycloak)
    try {
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
    } catch (keycloakError) {
      // If Keycloak user creation fails (user might already exist), try to sync anyway
      console.log('Keycloak user creation failed, trying to sync existing user:', keycloakError);
      
      // Try to get existing user from Keycloak
      try {
        const users = await this.keycloak.getUsers();
        const existingUser = users.find(u => u.email === body.email);
        
        if (existingUser && body.userType) {
          // Sync existing user to database
          if (body.userType === 'client') {
            await this.syncClientUseCase.execute({
              id: existingUser.id,
              keycloakUserId: existingUser.id,
              email: existingUser.email,
              name: body.username,
              phoneNumber: undefined,
              address: undefined
            });
            console.log(`Existing client ${body.email} synced to database`);
          } else if (body.userType === 'provider') {
            await this.syncProviderUseCase.execute({
              id: existingUser.id,
              keycloakUserId: existingUser.id,
              email: existingUser.email,
              name: body.username,
              services: body.services || []
            });
            console.log(`Existing provider ${body.email} synced to database`);
          }
          
          return { 
            message: "User synced successfully",
            user: existingUser
          };
        }
      } catch (syncError) {
        console.error('Error syncing existing user:', syncError);
        // If sync also fails, then throw the original error
        throw keycloakError;
      }
      
      // Don't throw keycloakError if sync was successful
      return;
    }
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
    // Step 1: Assign role in Keycloak
    const result = await this.keycloak.assignRoleToUser(body.username, body.roleName);
    
    // Step 2: Get user details from Keycloak to sync to database
    try {
      const users = await this.keycloak.getUsers();
      const user = users.find(u => u.username === body.username);
      
      if (user) {
        // Step 3: Sync user to local database based on role
        if (body.roleName.toLowerCase() === 'client') {
          await this.syncClientUseCase.execute({
            id: user.id,
            keycloakUserId: user.id,
            email: user.email,
            name: user.username,
            phoneNumber: undefined,
            address: undefined
          });
          console.log(`Client ${user.email} synced to database after role assignment`);
        } else if (body.roleName.toLowerCase() === 'provider') {
          await this.syncProviderUseCase.execute({
            id: user.id,
            keycloakUserId: user.id,
            email: user.email,
            name: user.username,
            services: []
          });
          console.log(`Provider ${user.email} synced to database after role assignment`);
        }
      }
    } catch (syncError) {
      console.error('Error syncing user to database after role assignment:', syncError);
      // Don't fail the role assignment, just log the error
    }
    
    return result;
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
