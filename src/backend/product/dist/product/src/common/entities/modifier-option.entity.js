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
exports.ModifierOption = void 0;
const typeorm_1 = require("typeorm");
const modifier_group_entity_1 = require("./modifier-group.entity");
let ModifierOption = class ModifierOption {
    id;
    modifierGroupId;
    label;
    priceDelta;
    displayOrder;
    isActive;
    createdAt;
    updatedAt;
    deletedAt;
    group;
};
exports.ModifierOption = ModifierOption;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ModifierOption.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ModifierOption.prototype, "modifierGroupId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 100 }),
    __metadata("design:type", String)
], ModifierOption.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ModifierOption.prototype, "priceDelta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ModifierOption.prototype, "displayOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ModifierOption.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ModifierOption.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ModifierOption.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", Date)
], ModifierOption.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => modifier_group_entity_1.ModifierGroup, (group) => group.options, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'modifierGroupId' }),
    __metadata("design:type", modifier_group_entity_1.ModifierGroup)
], ModifierOption.prototype, "group", void 0);
exports.ModifierOption = ModifierOption = __decorate([
    (0, typeorm_1.Entity)('modifier_options')
], ModifierOption);
//# sourceMappingURL=modifier-option.entity.js.map