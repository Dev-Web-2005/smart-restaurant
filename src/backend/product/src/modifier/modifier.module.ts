import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
	ModifierGroup,
	ModifierOption,
	MenuItem,
	MenuItemModifierGroup,
} from 'src/common/entities';
import { ModifierController } from './modifier.controller';
import { ModifierService } from './modifier.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			ModifierGroup,
			ModifierOption,
			MenuItem,
			MenuItemModifierGroup,
		]),
		ConfigModule,
	],
	controllers: [ModifierController],
	providers: [ModifierService],
	exports: [ModifierService],
})
export class ModifierModule {}
