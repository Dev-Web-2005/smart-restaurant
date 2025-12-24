import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user';
import { RemoveToken } from 'src/common/entities/remove-token';
import { JwtConfigModule } from 'src/common/config/jwt.config.module';

@Module({
	imports: [TypeOrmModule.forFeature([User, RemoveToken]), JwtConfigModule],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService],
})
export class AuthModule {}
