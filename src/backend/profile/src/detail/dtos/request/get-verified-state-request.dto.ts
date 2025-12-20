import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class GetVerifiedStateRequestDto {
	@IsNotEmpty({ message: 'userId should not be empty' })
	@Length(20, 50, { message: 'userId must be between 20 and 50 characters' })
	userId: string;

	@IsOptional()
	profileApiKey?: string;
}
