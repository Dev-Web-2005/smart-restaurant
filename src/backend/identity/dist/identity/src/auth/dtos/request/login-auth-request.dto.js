"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
class LoginAuthRequestDto {
    username;
    password;
    identityApiKey;
}
exports.default = LoginAuthRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'username should not be empty' }),
    (0, class_validator_1.Length)(4, 20, { message: 'username must be between 4 and 20 characters' }),
    __metadata("design:type", String)
], LoginAuthRequestDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'password should not be empty' }),
    (0, class_validator_1.Length)(8, 100, { message: 'password must be at least 8 characters long' }),
    __metadata("design:type", String)
], LoginAuthRequestDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LoginAuthRequestDto.prototype, "identityApiKey", void 0);
//# sourceMappingURL=login-auth-request.dto.js.map