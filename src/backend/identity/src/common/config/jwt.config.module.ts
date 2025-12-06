import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET_KEY'),
				// Không set signOptions mặc định vì sẽ sign riêng cho access & refresh
			}),
		}),
	],
	exports: [JwtModule],
})
export class JwtConfigModule {}
