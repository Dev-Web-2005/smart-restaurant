"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPublicMenuResponseDto = exports.PublicModifierDto = exports.PublicPhotoDto = exports.PublicMenuItemDto = exports.PublicMenuCategoryDto = void 0;
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
    photos;
    price;
    currency;
    prepTimeMinutes;
    isChefRecommended;
    status;
    modifiers;
}
exports.PublicMenuItemDto = PublicMenuItemDto;
class PublicPhotoDto {
    id;
    url;
    isPrimary;
    displayOrder;
}
exports.PublicPhotoDto = PublicPhotoDto;
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