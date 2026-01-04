import { IsNotEmpty, IsOptional } from 'class-validator';
export default class SendMailRequestDto {
	@IsNotEmpty({ message: 'Recipient information is required' })
	to: {
		email: string;
		name: string;
	};

	@IsNotEmpty({ message: 'Subject is required' })
	subject: string; // = Name of template

	@IsNotEmpty({ message: 'Variables are required' })
	variables: Map<string, string>; // = dynamic data to be injected in template

	@IsOptional()
	notificationApiKey?: string;
}
