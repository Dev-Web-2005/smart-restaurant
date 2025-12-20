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
exports.ModifyProfileRequestDto = void 0;
const class_validator_1 = require("class-validator");
class ModifyProfileRequestDto {
    userId;
    profileApiKey;
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
    verified;
}
exports.ModifyProfileRequestDto = ModifyProfileRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'userId should not be empty' }),
    (0, class_validator_1.Length)(20, 50, { message: 'userId must be between 20 and 50 characters' }),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "profileApiKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], ModifyProfileRequestDto.prototype, "birthDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "restaurantName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "businessAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "contractNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "contractEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "cardHolderName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "accountNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "expirationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "cvv", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "frontImage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModifyProfileRequestDto.prototype, "backImage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ModifyProfileRequestDto.prototype, "verified", void 0);
//# sourceMappingURL=modify-profile-request.dto.js.map