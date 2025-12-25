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
exports.MenuItem = void 0;
const typeorm_1 = require("typeorm");
const menu_category_entity_1 = require("./menu-category.entity");
const menu_item_photo_entity_1 = require("./menu-item-photo.entity");
const menu_item_modifier_group_entity_1 = require("./menu-item-modifier-group.entity");
const enums_1 = require("../enums");
let MenuItem = class MenuItem {
    id;
    tenantId;
    categoryId;
    name;
    description;
    price;
    currency;
    prepTimeMinutes;
    status;
    isChefRecommended;
    createdAt;
    updatedAt;
    deletedAt;
    category;
    modifierGroups;
    photos;
};
exports.MenuItem = MenuItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MenuItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MenuItem.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MenuItem.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 80 }),
    __metadata("design:type", String)
], MenuItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], MenuItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], MenuItem.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'VND', length: 10 }),
    __metadata("design:type", String)
], MenuItem.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], MenuItem.prototype, "prepTimeMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: enums_1.MenuItemStatus.AVAILABLE }),
    __metadata("design:type", Number)
], MenuItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MenuItem.prototype, "isChefRecommended", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MenuItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MenuItem.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", Date)
], MenuItem.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => menu_category_entity_1.MenuCategory, (category) => category.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'categoryId' }),
    __metadata("design:type", menu_category_entity_1.MenuCategory)
], MenuItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => menu_item_modifier_group_entity_1.MenuItemModifierGroup, (modifierGroup) => modifierGroup.menuItem, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], MenuItem.prototype, "modifierGroups", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => menu_item_photo_entity_1.MenuItemPhoto, (photo) => photo.menuItem, { cascade: true }),
    __metadata("design:type", Array)
], MenuItem.prototype, "photos", void 0);
exports.MenuItem = MenuItem = __decorate([
    (0, typeorm_1.Entity)()
], MenuItem);
//# sourceMappingURL=menu-item.entity.js.map