import { registerDecorator } from 'class-validator';
import { ValidationOptions } from 'class-validator/types/decorator/ValidationOptions';
import { MatchPasswordConstraint } from 'src/common/decorators/validation-constraint/match-password.validation-constraint';

export function MatchPassword(property: string, validationOptions?: ValidationOptions) {
	return function (object: any, propertyName: string) {
		registerDecorator({
			name: 'MatchPassword',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [property],
			options: validationOptions,
			validator: MatchPasswordConstraint,
		});
	};
}
