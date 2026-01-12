import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WaiterModule } from './waiter/waiter.module';

@Module({
	imports: [WaiterModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
