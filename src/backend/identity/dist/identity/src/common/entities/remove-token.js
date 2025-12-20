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
exports.RemoveToken = void 0;
const typeorm_1 = require("typeorm");
let RemoveToken = class RemoveToken {
    token;
    tokenType;
    expiryDate;
    createdAt;
    userId;
};
exports.RemoveToken = RemoveToken;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], RemoveToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], RemoveToken.prototype, "tokenType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'timestamp' }),
    __metadata("design:type", Date)
], RemoveToken.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RemoveToken.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], RemoveToken.prototype, "userId", void 0);
exports.RemoveToken = RemoveToken = __decorate([
    (0, typeorm_1.Entity)()
], RemoveToken);
//# sourceMappingURL=remove-token.js.map