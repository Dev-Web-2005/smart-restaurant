"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPublicMenuResponseDto = exports.PublicModifierDto = exports.PublicMenuItemDto = exports.PublicMenuCategoryDto = void 0;
class PublicMenuCategoryDto {
    id;
    name;
    description;
    items;
}
exports.PublicMenuCategoryDto = PublicMenuCategoryDto;
class PublicMenuItemDto {
    id;
    categoryId;
    name;
    description;
    imageUrl;
    price;
    currency;
    available;
    modifiers;
}
exports.PublicMenuItemDto = PublicMenuItemDto;
class PublicModifierDto {
    id;
    groupName;
    label;
    priceDelta;
    type;
}
exports.PublicModifierDto = PublicModifierDto;
class GetPublicMenuResponseDto {
    tenantId;
    categories;
}
exports.GetPublicMenuResponseDto = GetPublicMenuResponseDto;
//# sourceMappingURL=public-menu-response.dto.js.map