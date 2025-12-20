"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_1 = require("../common/entities/user");
const register_user_response_dto_1 = __importDefault(require("./dtos/response/register-user-response.dto"));
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const roles_service_1 = require("../roles/roles.service");
const enum_1 = require("../../../shared/src/utils/enum");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const get_role_response_dto_1 = __importDefault(require("../roles/dtos/response/get-role-response.dto"));
const get_authority_response_dto_1 = __importDefault(require("../authorities/dtos/response/get-authority-response.dto"));
const get_user_response_dto_1 = require("./dtos/response/get-user-response.dto");
const microservices_1 = require("@nestjs/microservices");
const common_2 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const utils_1 = require("../../../shared/src/utils/utils");
const chef_account_response_dto_1 = __importDefault(require("./dtos/response/chef-account-response.dto"));
const class_transformer_1 = require("class-transformer");
let UsersService = class UsersService {
    userRepository;
    rolesService;
    profileClient;
    PROFILE_FIELDS = [
        'birthDay',
        'phoneNumber',
        'address',
        'restaurantName',
        'businessAddress',
        'contractNumber',
        'contractEmail',
        'cardHolderName',
        'accountNumber',
        'expirationDate',
        'cvv',
        'frontImage',
        'backImage',
    ];
    constructor(userRepository, rolesService, profileClient) {
        this.userRepository = userRepository;
        this.rolesService = rolesService;
        this.profileClient = profileClient;
    }
    async Register(data) {
        const isCustomer = data.isCustomer || false;
        const rolesString = data.roles ||
            (isCustomer ? [enum_1.RoleEnum[enum_1.RoleEnum.CUSTOMER]] : [enum_1.RoleEnum[enum_1.RoleEnum.USER]]);
        const roles = [];
        for (const role of rolesString) {
            const roleInt = enum_1.RoleEnum[role];
            const roleInRepo = await this.rolesService.getRoleById(roleInt);
            if (!roleInRepo) {
                throw new app_exception_1.default(error_code_1.default.ROLE_NOT_FOUND);
            }
            roles.push(roleInRepo);
        }
        const user = this.userRepository.create({
            username: data.username,
            email: data.email,
            password: await bcrypt.hash(data.password, 10),
            roles: roles,
        });
        try {
            const savedUser = await this.userRepository.save(user);
            const response = new register_user_response_dto_1.default();
            response.userId = savedUser.userId;
            response.username = savedUser.username;
            response.email = savedUser.email;
            response.roles = savedUser.roles.map((role) => {
                const dto = new get_role_response_dto_1.default();
                dto.name = enum_1.RoleEnum[role.name];
                dto.description = role.description;
                dto.authorities = role.authorities.map((authority) => {
                    return new get_authority_response_dto_1.default({
                        name: enum_1.AuthorityEnum[authority.name],
                        description: authority.description,
                    });
                });
                return dto;
            });
            if (rolesString.includes(enum_1.RoleEnum[enum_1.RoleEnum.USER])) {
                try {
                    const profileData = {
                        userId: savedUser.userId,
                        profileApiKey: process.env.PROFILE_API_KEY,
                        ...(0, utils_1.extractFields)(data, this.PROFILE_FIELDS),
                    };
                    const profile = await (0, rxjs_1.firstValueFrom)(this.profileClient.send('profiles:modify-profile', profileData));
                    if (!profile || !profile.userId) {
                        await this.userRepository.delete({ userId: savedUser.userId });
                        throw new app_exception_1.default(error_code_1.default.PROFILE_SERVICE_ERROR);
                    }
                }
                catch (err) {
                    await this.userRepository.delete({ userId: savedUser.userId });
                    if (err instanceof app_exception_1.default) {
                        throw err;
                    }
                    console.error('Error calling profile service:', err);
                    throw new app_exception_1.default(error_code_1.default.PROFILE_SERVICE_ERROR);
                }
                const chefAccount = await this.generateChefAccount(savedUser.userId);
                response.chefAccount = chefAccount;
            }
            return response;
        }
        catch (err) {
            console.error('Error saving user:', err);
            throw new app_exception_1.default(error_code_1.default.USER_ALREADY_EXISTS);
        }
    }
    async getAllUsers() {
        const users = await this.userRepository.find({
            relations: ['roles', 'roles.authorities'],
        });
        return users.map((user) => {
            const dto = new get_user_response_dto_1.GetUserResponseDto();
            dto.userId = user.userId;
            dto.username = user.username;
            dto.email = user.email;
            dto.roles = user.roles.map((role) => {
                const roleDto = new get_role_response_dto_1.default();
                roleDto.name = enum_1.RoleEnum[role.name];
                roleDto.description = role.description;
                roleDto.authorities = role.authorities.map((authority) => {
                    return new get_authority_response_dto_1.default({
                        name: enum_1.AuthorityEnum[authority.name],
                        description: authority.description,
                    });
                });
                return roleDto;
            });
            return dto;
        });
    }
    async getUserById(userId) {
        const user = await this.userRepository.findOne({
            where: { userId },
            relations: ['roles', 'roles.authorities'],
        });
        if (!user) {
            return null;
        }
        const dto = new get_user_response_dto_1.GetUserResponseDto();
        dto.userId = user.userId;
        dto.username = user.username;
        dto.email = user.email;
        dto.roles = user.roles.map((role) => {
            const roleDto = new get_role_response_dto_1.default();
            roleDto.name = enum_1.RoleEnum[role.name];
            roleDto.description = role.description;
            roleDto.authorities = role.authorities.map((authority) => {
                return new get_authority_response_dto_1.default({
                    name: enum_1.AuthorityEnum[authority.name],
                    description: authority.description,
                });
            });
            return roleDto;
        });
        return dto;
    }
    async generateChefAccount(userId) {
        const username = `chef_${Math.random().toString(36).substring(2, 10)}`;
        const password = `${Math.random().toString(36).substring(2, 10)}`;
        const email = `${username}@created-by-ltc.com`;
        try {
            const chefRole = await this.rolesService.getRoleByName(enum_1.RoleEnum[enum_1.RoleEnum.CHEF]);
            if (!chefRole) {
                throw new app_exception_1.default(error_code_1.default.ROLE_NOT_FOUND);
            }
            const user = this.userRepository.create({
                username: username,
                email: email,
                ownerId: userId,
                password: await bcrypt.hash(password, 10),
                roles: [chefRole],
            });
            try {
                const createdUser = await this.userRepository.save(user);
                return (0, class_transformer_1.plainToInstance)(chef_account_response_dto_1.default, {
                    username: createdUser.username,
                    email: createdUser.email,
                    password: password,
                    ownerId: createdUser.ownerId,
                });
            }
            catch (err) {
                console.error('Error saving chef user:', err);
                throw new app_exception_1.default(error_code_1.default.CHEF_ACCOUNT_CREATION_FAILED);
            }
        }
        catch (err) {
            if (err instanceof app_exception_1.default) {
                throw err;
            }
            console.error('Error generating chef account:', err);
            throw new app_exception_1.default(error_code_1.default.CHEF_ACCOUNT_CREATION_FAILED);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_1.User)),
    __param(2, (0, common_2.Inject)('PROFILE_SERVICE')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        roles_service_1.RolesService,
        microservices_1.ClientProxy])
], UsersService);
//# sourceMappingURL=users.service.js.map