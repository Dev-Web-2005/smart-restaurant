import { Module } from '@nestjs/common';
import { AuthoritiesService } from './authorities.service';
import { AuthoritiesController } from './authorities.controller';

@Module({
  providers: [AuthoritiesService],
  controllers: [AuthoritiesController]
})
export class AuthoritiesModule {}
