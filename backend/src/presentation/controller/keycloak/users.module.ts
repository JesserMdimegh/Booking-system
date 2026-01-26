import { Module } from "@nestjs/common";
import { UsersController } from "./users.cotroller";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { ClientsModule } from "../../../modules/clients.module";
import { ProvidersModule } from "../../../modules/providers.module";

@Module({
  imports: [ClientsModule, ProvidersModule],
  controllers: [UsersController],
  providers: [KeycloakAdminService],
})
export class UsersModule {}
