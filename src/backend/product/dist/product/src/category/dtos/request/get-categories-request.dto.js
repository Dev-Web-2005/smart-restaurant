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
exports.GetCategoriesRequestDto = exports.SortOrder = exports.CategorySortBy = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../../common/enums");
var CategorySortBy;
(function (CategorySortBy) {
    CategorySortBy["DISPLAY_ORDER"] = "displayOrder";
    CategorySortBy["NAME"] = "name";
    CategorySortBy["CREATED_AT"] = "createdAt";
})(CategorySortBy || (exports.CategorySortBy = CategorySortBy = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "ASC";
    SortOrder["DESC"] = "DESC";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
class GetCategoriesRequestDto {
    tenantId;
    status;
    search;
    sortBy;
    sortOrder;
    productApiKey;
}
exports.GetCategoriesRequestDto = GetCategoriesRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetCategoriesRequestDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Status must be a string' }),
    (0, class_validator_1.IsIn)(['ACTIVE', 'INACTIVE', 'active', 'inactive'], {
        message: 'Status must be either ACTIVE or INACTIVE',
    }),
    (0, class_transformer_1.Transform)(({ value }) => (value ? (0, enums_1.categoryStatusFromString)(value) : undefined)),
    __metadata("design:type", Number)
], GetCategoriesRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetCategoriesRequestDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CategorySortBy),
    __metadata("design:type", String)
], GetCategoriesRequestDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SortOrder),
    __metadata("design:type", String)
], GetCategoriesRequestDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetCategoriesRequestDto.prototype, "productApiKey", void 0);
//# sourceMappingURL=get-categories-request.dto.js.map