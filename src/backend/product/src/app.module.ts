import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoryModule } from './category/category.module';
import { ItemModule } from './item/item.module';
import { PublicModule } from './public/public.module';
import { ModifierModule } from './modifier/modifier.module';
import { ReviewModule } from './review/review.module';
import {
	MenuCategory,
	MenuItem,
	MenuItemPhoto,
	ModifierGroup,
	ModifierOption,
	MenuItemModifierGroup,
	MenuItemReview,
} from './common/entities';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				host: configService.get('HOST_DB'),
				port: +configService.get('PORT_DB'),
				username: configService.get('USERNAME_DB'),
				password: configService.get('PASSWORD_DB'),
				database: configService.get('DATABASE_DB'),
				entities: [
					MenuCategory,
					MenuItem,
					MenuItemPhoto,
					ModifierGroup,
					ModifierOption,
					MenuItemModifierGroup,
					MenuItemReview,
				],
				synchronize: true,
				logging: false,
			}),
			inject: [ConfigService],
		}),
		CategoryModule,
		ItemModule,
		PublicModule,
		ModifierModule,
		ReviewModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
