import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './infrastructure/auth/auth.module';
import { UsersModule } from './presentation/controller/keycloak/users.module';
import { AppointmentsModule } from './modules/appointments.module';
import { ProvidersModule } from './modules/providers.module';
import { ClientsModule } from './modules/clients.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // VERY IMPORTANT
    }),
    AppointmentsModule,
    ProvidersModule,
    ClientsModule,
    UsersModule,
    AuthModule
    
    ],
  
})
export class AppModule {}
