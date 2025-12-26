import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchPassword', async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
	validate(value: any, args: ValidationArguments) {
		const [relatedPropertyName] = args.constraints;
		return value === (args.object as any)[relatedPropertyName];
	}

	defaultMessage(args: ValidationArguments) {
		const [relatedPropertyName] = args.constraints;
		return `${args.property} must match ${relatedPropertyName}`;
	}
}
