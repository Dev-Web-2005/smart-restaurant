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
exports.CreateCategoryRequestDto = void 0;
const class_validator_1 = require("class-validator");
class CreateCategoryRequestDto {
    tenantId;
    name;
    description;
    status;
    displayOrder;
    productApiKey;
}
exports.CreateCategoryRequestDto = CreateCategoryRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Tenant ID must not be empty' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Tenant ID must be a valid UUID' }),
    __metadata("design:type", String)
], CreateCategoryRequestDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Name of the category must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Name of the category must not be empty' }),
    (0, class_validator_1.Length)(2, 50, { message: 'Category name must be between 2 and 50 characters' }),
    __metadata("design:type", String)
], CreateCategoryRequestDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    __metadata("design:type", String)
], CreateCategoryRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Status must be a string' }),
    (0, class_validator_1.IsIn)(['ACTIVE', 'INACTIVE', 'active', 'inactive'], {
        message: 'Status must be either ACTIVE or INACTIVE',
    }),
    __metadata("design:type", Object)
], CreateCategoryRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Display order must be an integer' }),
    (0, class_validator_1.Min)(0, { message: 'Display order must be a non-negative integer' }),
    __metadata("design:type", Number)
], CreateCategoryRequestDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Product API key must not be empty' }),
    (0, class_validator_1.IsString)({ message: 'Product API key must be a string' }),
    __metadata("design:type", String)
], CreateCategoryRequestDto.prototype, "productApiKey", void 0);
//# sourceMappingURL=create-category-request.dto.js.map