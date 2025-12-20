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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableController = void 0;
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const auth_guard_1 = require("../../common/guards/get-role/auth.guard");
const rxjs_1 = require("rxjs");
let TableController = class TableController {
    tableClient;
    configService;
    constructor(tableClient, configService) {
        this.tableClient = tableClient;
        this.configService = configService;
    }
    createTable(tenantId, data) {
        return this.tableClient.send('tables:create', {
            ...data,
            tenantId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        });
    }
    listTables(tenantId, isActive, location) {
        const payload = {
            tenantId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        };
        if (isActive !== undefined) {
            payload.isActive = isActive === 'true';
        }
        if (location) {
            payload.location = location;
        }
        return this.tableClient.send('tables:list', payload);
    }
    getTableById(tenantId, tableId) {
        return this.tableClient.send('tables:get-by-id', {
            tenantId,
            tableId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        });
    }
    updateTable(tenantId, tableId, data) {
        return this.tableClient.send('tables:update', {
            tenantId,
            tableId,
            data: {
                ...data,
                tableApiKey: this.configService.get('TABLE_API_KEY'),
            },
        });
    }
    deleteTable(tenantId, tableId) {
        return this.tableClient.send('tables:delete', {
            tableId,
            tenantId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        });
    }
    generateQrCode(tableId, req) {
        const userId = req.user?.userId;
        return this.tableClient.send('qr:generate', {
            tableId,
            tenantId: userId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        });
    }
    async validateScan(token, res) {
        try {
            const result = await (0, rxjs_1.firstValueFrom)(this.tableClient.send('qr:validate-scan', {
                token,
                tableApiKey: this.configService.get('TABLE_API_KEY'),
            }));
            if (this.configService.get('MOD') === 'development') {
                console.log('QR Scan Validated:', result);
                return res.status(200).json({ redirect: result.redirect });
            }
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
            const redirectUrl = frontendUrl + result.redirect;
            return res.redirect(302, redirectUrl);
        }
        catch (error) {
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
            return res.redirect(302, `${frontendUrl}/qr-error?message=${encodeURIComponent(error.message || 'Invalid QR Code')}`);
        }
    }
};
exports.TableController = TableController;
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('/tenants/:tenantId/tables'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "createTable", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/tenants/:tenantId/tables'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('isActive')),
    __param(2, (0, common_1.Query)('location')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "listTables", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/tenants/:tenantId/tables/:tableId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "getTableById", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Patch)('/tenants/:tenantId/tables/:tableId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "updateTable", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Delete)('/tenants/:tenantId/tables/:tableId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "deleteTable", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('tables/:tableId/qrcode'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Request]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "generateQrCode", null);
__decorate([
    (0, common_1.Get)('tables/scan/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "validateScan", null);
exports.TableController = TableController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)('TABLE_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        config_1.ConfigService])
], TableController);
//# sourceMappingURL=table.controller.js.map