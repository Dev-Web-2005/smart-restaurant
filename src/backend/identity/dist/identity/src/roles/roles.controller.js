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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const create_role_request_dto_1 = __importDefault(require("./dtos/request/create-role-request.dto"));
const roles_service_1 = require("./roles.service");
const http_response_1 = __importDefault(require("../../../shared/src/utils/http-response"));
const config_1 = require("@nestjs/config");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const get_all_roles_request_dto_1 = require("./dtos/request/get-all-roles-request.dto");
const rpc_error_handler_1 = require("../../../shared/src/utils/rpc-error-handler");
let RolesController = class RolesController {
    rolesService;
    config;
    constructor(rolesService, config) {
        this.rolesService = rolesService;
        this.config = config;
    }
    async getAllRoles(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('IDENTITY_API_KEY');
            if (data.identityApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return new http_response_1.default(200, 'Get all roles successful', await this.rolesService.getAllRoles());
        });
    }
    async createRole(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('IDENTITY_API_KEY');
            if (data.identityApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return new http_response_1.default(200, 'Create role successful', await this.rolesService.createRole(data));
        });
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, microservices_1.MessagePattern)('roles:get-all-roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_all_roles_request_dto_1.GetAllRolesRequestDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getAllRoles", null);
__decorate([
    (0, microservices_1.MessagePattern)('roles:create-role'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_request_dto_1.default]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "createRole", null);
exports.RolesController = RolesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [roles_service_1.RolesService,
        config_1.ConfigService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map