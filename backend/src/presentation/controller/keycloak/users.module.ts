import { Module } from "@nestjs/common";
import { UsersController } from "./users.cotroller";
import { KeycloakAdminService } from "./keycloak-admin.service";

@Module({
  controllers: [UsersController],
  providers: [KeycloakAdminService],
})
export class UsersModule {}
