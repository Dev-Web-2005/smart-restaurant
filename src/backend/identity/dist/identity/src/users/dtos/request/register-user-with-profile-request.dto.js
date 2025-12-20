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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const register_user_request_dto_1 = __importDefault(require("./register-user-request.dto"));
class RegisterUserWithProfileRequestDto extends register_user_request_dto_1.default {
    identityApiKey;
    userId;
    birthDay;
    phoneNumber;
    address;
    restaurantName;
    businessAddress;
    contractNumber;
    contractEmail;
    cardHolderName;
    accountNumber;
    expirationDate;
    cvv;
    frontImage;
    backImage;
    isCustomer = false;
}
exports.default = RegisterUserWithProfileRequestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "identityApiKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], RegisterUserWithProfileRequestDto.prototype, "birthDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "restaurantName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "businessAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "contractNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "contractEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "cardHolderName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "accountNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "expirationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "cvv", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "frontImage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterUserWithProfileRequestDto.prototype, "backImage", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'isCustomer must be a boolean value' }),
    __metadata("design:type", Boolean)
], RegisterUserWithProfileRequestDto.prototype, "isCustomer", void 0);
//# sourceMappingURL=register-user-with-profile-request.dto.js.map