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
exports.AuthoritiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const get_authority_response_dto_1 = __importDefault(require("./dtos/response/get-authority-response.dto"));
const authority_1 = require("../common/entities/authority");
const typeorm_2 = require("typeorm");
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const enum_1 = require("../../../shared/src/utils/enum");
let AuthoritiesService = class AuthoritiesService {
    authorityRepository;
    constructor(authorityRepository) {
        this.authorityRepository = authorityRepository;
    }
    async getAllAuthorities() {
        const authorities = await this.authorityRepository.find();
        return authorities.map((authority) => new get_authority_response_dto_1.default({
            name: enum_1.AuthorityEnum[authority.name],
            description: authority.description,
        }));
    }
    async getAuthorityById(name) {
        const authority = await this.authorityRepository.findOneBy({ name });
        if (!authority) {
            return null;
        }
        return authority;
    }
    async createAuthority(createAuthorityRequestDto) {
        const authorityName = createAuthorityRequestDto.name;
        const authorityEnumValue = enum_1.AuthorityEnum[authorityName];
        if (authorityEnumValue === undefined) {
            throw new app_exception_1.default(error_code_1.default.AUTHORITY_NOT_FOUND);
        }
        try {
            const savedAuthority = await this.authorityRepository.save({
                name: authorityEnumValue,
                description: createAuthorityRequestDto?.description,
            });
            return new get_authority_response_dto_1.default({
                name: enum_1.AuthorityEnum[savedAuthority.name],
                description: savedAuthority.description,
            });
        }
        catch (err) {
            console.error('Error creating authority:', err);
            throw new app_exception_1.default(error_code_1.default.AUTHORITY_CREATION_FAILED);
        }
    }
    async deleteAuthority(name) {
        const nameInt = enum_1.AuthorityEnum[name];
        await this.authorityRepository.delete({ name: nameInt });
    }
};
exports.AuthoritiesService = AuthoritiesService;
exports.AuthoritiesService = AuthoritiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(authority_1.Authority)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuthoritiesService);
//# sourceMappingURL=authorities.service.js.map