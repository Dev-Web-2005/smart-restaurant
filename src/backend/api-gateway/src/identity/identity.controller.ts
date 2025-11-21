import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
@Controller('identity')
export class IdentityController {
	constructor(@Inject('IDENTITY_SERVICE') private readonly identityClient: ClientProxy) {}

	@Post('/users/register')
	registerUser(@Body() data: any) {
		return this.identityClient.send({ cmd: 'users:register' }, data);
	}
}
