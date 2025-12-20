"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemResponseDto = exports.ModifierResponseDto = void 0;
class ModifierResponseDto {
    id;
    itemId;
    groupName;
    label;
    priceDelta;
    type;
}
exports.ModifierResponseDto = ModifierResponseDto;
class ItemResponseDto {
    id;
    tenantId;
    categoryId;
    name;
    description;
    imageUrl;
    price;
    currency;
    available;
    published;
    createdAt;
    modifiers;
}
exports.ItemResponseDto = ItemResponseDto;
//# sourceMappingURL=item-response.dto.js.map