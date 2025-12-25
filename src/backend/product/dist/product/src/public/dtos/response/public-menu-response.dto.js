"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPublicMenuResponseDto = exports.PublicMenuItemDto = exports.PublicModifierGroupDto = exports.PublicModifierOptionDto = exports.PublicPhotoDto = exports.PublicMenuCategoryDto = void 0;
class PublicMenuCategoryDto {
    id;
    name;
    description;
    items;
}
exports.PublicMenuCategoryDto = PublicMenuCategoryDto;
class PublicPhotoDto {
    id;
    url;
    isPrimary;
    displayOrder;
}
exports.PublicPhotoDto = PublicPhotoDto;
class PublicModifierOptionDto {
    id;
    label;
    priceDelta;
    displayOrder;
}
exports.PublicModifierOptionDto = PublicModifierOptionDto;
class PublicModifierGroupDto {
    id;
    name;
    displayOrder;
    isRequired;
    minSelections;
    maxSelections;
    options;
}
exports.PublicModifierGroupDto = PublicModifierGroupDto;
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
    modifierGroups;
}
exports.PublicMenuItemDto = PublicMenuItemDto;
class GetPublicMenuResponseDto {
    tenantId;
    categories;
}
exports.GetPublicMenuResponseDto = GetPublicMenuResponseDto;
//# sourceMappingURL=public-menu-response.dto.js.map