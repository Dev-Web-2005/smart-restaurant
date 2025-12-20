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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableController = void 0;
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const auth_guard_1 = require("../../common/guards/get-role/auth.guard");
const rxjs_1 = require("rxjs");
const check_role_guard_1 = __importDefault(require("../../common/guards/check-role/check-role.guard"));
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
    listTables(tenantId, isActive, status, floorId, includeFloor) {
        const payload = {
            tenantId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        };
        if (isActive !== undefined) {
            payload.isActive = isActive === 'true';
        }
        if (status) {
            payload.status = status;
        }
        if (floorId) {
            payload.floorId = floorId;
        }
        if (includeFloor !== undefined) {
            payload.includeFloor = includeFloor === 'true';
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
    generateQrCode(tenantId, tableId) {
        return this.tableClient.send('qr:generate', {
            tenantId,
            tableId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        });
    }
    getQrCode(tenantId, tableId) {
        return this.tableClient.send('qr:get', {
            tenantId,
            tableId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        });
    }
    async downloadQrCode(tenantId, tableId, format = 'png', res) {
        const validFormats = ['png', 'pdf', 'svg'];
        if (!validFormats.includes(format.toLowerCase())) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Invalid format. Supported formats: png, pdf, svg',
            });
        }
        const result = await (0, rxjs_1.firstValueFrom)(this.tableClient.send('qr:download', {
            tenantId,
            tableId,
            format: format.toLowerCase(),
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        }));
        const buffer = Buffer.from(result.data, 'base64');
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
    }
    async batchDownloadQrCode(res, tenantId, format = 'combined-pdf', tableIds, floorId) {
        const validFormats = ['zip-png', 'zip-pdf', 'zip-svg', 'combined-pdf'];
        if (!validFormats.includes(format.toLowerCase())) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Invalid format. Supported formats: zip-png, zip-pdf, zip-svg, combined-pdf',
            });
        }
        let tableIdArray;
        if (tableIds) {
            tableIdArray = tableIds.split(',').filter((id) => id.trim());
        }
        const result = await (0, rxjs_1.firstValueFrom)(this.tableClient.send('qr:batch-download', {
            tenantId,
            format: format.toLowerCase(),
            tableIds: tableIdArray,
            floorId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        }));
        const buffer = Buffer.from(result.data, 'base64');
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
    }
    async validateScan(tenantId, token, res) {
        try {
            const result = await (0, rxjs_1.firstValueFrom)(this.tableClient.send('qr:validate-scan', {
                tenantId,
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
    bulkRegenerateQrCode(tenantId, body) {
        return this.tableClient.send('qr:bulk-regenerate', {
            tenantId,
            tableIds: body?.tableIds,
            floorId: body?.floorId,
            tableApiKey: this.configService.get('TABLE_API_KEY'),
        });
    }
};
exports.TableController = TableController;
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Post)('/tenants/:tenantId/tables'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "createTable", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Get)('/tenants/:tenantId/tables'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('isActive')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('floorId')),
    __param(4, (0, common_1.Query)('includeFloor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "listTables", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Get)('/tenants/:tenantId/tables/:tableId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "getTableById", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Patch)('/tenants/:tenantId/tables/:tableId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "updateTable", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Delete)('/tenants/:tenantId/tables/:tableId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "deleteTable", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Post)('/tenants/:tenantId/tables/:tableId/qrcode'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "generateQrCode", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Get)('/tenants/:tenantId/tables/:tableId/qrcode'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "getQrCode", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Get)('/tenants/:tenantId/tables/:tableId/qrcode/download'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('tableId')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "downloadQrCode", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Get)('/tenants/:tenantId/tables/qrcode/batch-download'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Query)('tableIds')),
    __param(4, (0, common_1.Query)('floorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "batchDownloadQrCode", null);
__decorate([
    (0, common_1.Get)('/tenants/:tenantId/tables/scan/:token'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('token')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TableController.prototype, "validateScan", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    (0, common_1.Post)('/tenants/:tenantId/tables/qrcode/bulk-regenerate'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TableController.prototype, "bulkRegenerateQrCode", null);
exports.TableController = TableController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)('TABLE_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        config_1.ConfigService])
], TableController);
//# sourceMappingURL=table.controller.js.map