"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchPassword = MatchPassword;
const class_validator_1 = require("class-validator");
const match_password_validation_constraint_1 = require("../validation-constraint/match-password.validation-constraint");
function MatchPassword(property, validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'MatchPassword',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: match_password_validation_constraint_1.MatchPasswordConstraint,
        });
    };
}
//# sourceMappingURL=match-password.decorator.js.map