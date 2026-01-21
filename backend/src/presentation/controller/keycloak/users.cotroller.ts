import { Body, Controller, Get, Post, UseGuards, Param } from "@nestjs/common";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { Public, Roles } from "src/infrastructure/auth/public.decorator";
import { Role } from "src/shared/domain/enums/user-role.enum.js";
@UseGuards()
@Controller("keycloak/")
export class UsersController {
  constructor(private readonly keycloak: KeycloakAdminService) {}
  //create user using keylaock REST APIs
  @Public()
  @Post('users')
  async createUser(
    @Body()
    body: { username: string; email: string; password: string }
  ) {
    await this.keycloak.createUser(body);
    return { message: "User created successfully" };
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
