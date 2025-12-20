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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const users_service_1 = require("./users.service");
const http_response_1 = __importDefault(require("../../../shared/src/utils/http-response"));
const config_1 = require("@nestjs/config");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const register_user_with_profile_request_dto_1 = __importDefault(require("./dtos/request/register-user-with-profile-request.dto"));
const get_all_users_request_dto_1 = require("./dtos/request/get-all-users-request.dto");
const get_user_by_id_request_dto_1 = require("./dtos/request/get-user-by-id-request.dto");
const rpc_error_handler_1 = require("../../../shared/src/utils/rpc-error-handler");
let UsersController = class UsersController {
    usersService;
    config;
    constructor(usersService, config) {
        this.usersService = usersService;
        this.config = config;
    }
    async registerUser(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('IDENTITY_API_KEY');
            if (data.identityApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return new http_response_1.default(200, 'Register successful', await this.usersService.Register(data));
        });
    }
    async getAllUsers(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('IDENTITY_API_KEY');
            if (data.identityApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return new http_response_1.default(200, 'Get all users successful', await this.usersService.getAllUsers());
        });
    }
    async getUserById(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('IDENTITY_API_KEY');
            if (data.identityApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return new http_response_1.default(200, 'Get user by id successful', await this.usersService.getUserById(data.userId));
        });
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, microservices_1.MessagePattern)('users:register'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_user_with_profile_request_dto_1.default]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "registerUser", null);
__decorate([
    (0, microservices_1.MessagePattern)('users:get-all-users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_all_users_request_dto_1.GetAllUsersRequestDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    (0, microservices_1.MessagePattern)('users:get-user-by-id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_by_id_request_dto_1.GetUserByIdRequestDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService])
], UsersController);
//# sourceMappingURL=users.controller.js.map