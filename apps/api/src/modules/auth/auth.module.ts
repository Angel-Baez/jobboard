import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthResolver } from './auth.resolver';

@Module({
  providers: [AuthService, AuthResolver],
  controllers: [AuthController],
  // Export AuthService so SessionGuard (registered globally in AppModule) can inject it
  exports: [AuthService],
})
export class AuthModule {}
