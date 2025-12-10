import { Module } from '@nestjs/common';
import { QrCodeService } from 'src/qr-code/qr-code.service';
import { QrCodeController } from 'src/qr-code/qr-code.controller';
import { TablesModule } from 'src/tables/tables.module';

@Module({
	imports: [TablesModule],
	controllers: [QrCodeController],
	providers: [QrCodeService],
	exports: [QrCodeService],
})
export class QrCodeModule {}
