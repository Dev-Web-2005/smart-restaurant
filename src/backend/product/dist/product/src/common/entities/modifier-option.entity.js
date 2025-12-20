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
const menu_item_entity_1 = require("./menu-item.entity");
let ModifierOption = class ModifierOption {
    id;
    itemId;
    groupName;
    label;
    priceDelta;
    type;
    item;
};
exports.ModifierOption = ModifierOption;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ModifierOption.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ModifierOption.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ModifierOption.prototype, "groupName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ModifierOption.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { default: 0 }),
    __metadata("design:type", Number)
], ModifierOption.prototype, "priceDelta", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'single' }),
    __metadata("design:type", String)
], ModifierOption.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => menu_item_entity_1.MenuItem, (item) => item.modifiers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'itemId' }),
    __metadata("design:type", menu_item_entity_1.MenuItem)
], ModifierOption.prototype, "item", void 0);
exports.ModifierOption = ModifierOption = __decorate([
    (0, typeorm_1.Entity)()
], ModifierOption);
//# sourceMappingURL=modifier-option.entity.js.map