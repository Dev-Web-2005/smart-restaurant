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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const authorities_service_1 = require("../authorities/authorities.service");
const get_authority_response_dto_1 = __importDefault(require("../authorities/dtos/response/get-authority-response.dto"));
const role_1 = require("../common/entities/role");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const create_role_response_dto_1 = __importDefault(require("./dtos/response/create-role-response.dto"));
const get_role_response_dto_1 = __importDefault(require("./dtos/response/get-role-response.dto"));
const enum_1 = require("../../../shared/src/utils/enum");
const typeorm_2 = require("typeorm");
let RolesService = class RolesService {
    roleRepository;
    authorityService;
    constructor(roleRepository, authorityService) {
        this.roleRepository = roleRepository;
        this.authorityService = authorityService;
    }
    async getAllRoles() {
        const roles = await this.roleRepository.find({
            relations: ['authorities'],
        });
        return roles.map((role) => {
            console.log(role);
            const dto = new get_role_response_dto_1.default();
            dto.name = enum_1.RoleEnum[role.name];
            dto.description = role.description;
            dto.authorities = role.authorities.map((authority) => new get_authority_response_dto_1.default({
                name: enum_1.AuthorityEnum[authority.name],
                description: authority.description,
            }));
            return dto;
        });
    }
    async getRoleById(name) {
        const roles = await this.roleRepository.findOne({
            where: { name },
            relations: ['authorities'],
        });
        if (!roles) {
            return null;
        }
        return roles;
    }
    async createRole(createDto) {
        try {
            const authorities = createDto.authorities || [];
            const authoritiesEntities = [];
            for (const authority of authorities) {
                const authorityInt = enum_1.AuthorityEnum[authority];
                const authorityInRepo = await this.authorityService.getAuthorityById(authorityInt);
                if (!authorityInRepo) {
                    throw new app_exception_1.default(error_code_1.default.AUTHORITY_NOT_FOUND);
                }
                authoritiesEntities.push(authorityInRepo);
            }
            const savedRole = await this.roleRepository.save({
                name: enum_1.RoleEnum[createDto.name],
                description: createDto?.description,
                authorities: authoritiesEntities,
            });
            const response = new create_role_response_dto_1.default();
            response.name = enum_1.RoleEnum[savedRole.name];
            response.description = savedRole.description;
            response.authorities = savedRole.authorities.map((authority) => new get_authority_response_dto_1.default({
                name: enum_1.AuthorityEnum[authority.name],
                description: authority.description,
            }));
            return response;
        }
        catch (err) {
            console.error('Error creating role:', err);
            throw new app_exception_1.default(error_code_1.default.ROLE_CREATION_FAILED);
        }
    }
    async deleteRole(name) {
        const nameInt = enum_1.RoleEnum[name];
        await this.roleRepository.delete({ name: nameInt });
    }
    async getRoleByName(name) {
        const nameInt = enum_1.RoleEnum[name];
        const role = await this.roleRepository.findOne({
            where: { name: nameInt },
            relations: ['authorities'],
        });
        if (!role) {
            return null;
        }
        return role;
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        authorities_service_1.AuthoritiesService])
], RolesService);
//# sourceMappingURL=roles.service.js.map