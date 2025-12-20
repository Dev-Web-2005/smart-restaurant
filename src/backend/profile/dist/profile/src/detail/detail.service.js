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
exports.DetailService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const get_profile_response_dto_1 = __importDefault(require("./dtos/response/get-profile-response.dto"));
const profile_1 = __importDefault(require("../common/entities/profile"));
const typeorm_2 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const utils_1 = require("../../../shared/src/utils/utils");
const config_1 = require("@nestjs/config");
let DetailService = class DetailService {
    profileRepository;
    config;
    constructor(profileRepository, config) {
        this.profileRepository = profileRepository;
        this.config = config;
    }
    async getProfileServiceStatus(userId) {
        const profile = await this.profileRepository.findOneBy({ userId });
        if (!profile) {
            throw new app_exception_1.default(error_code_1.default.PROFILE_NOT_FOUND);
        }
        return (0, class_transformer_1.plainToInstance)(get_profile_response_dto_1.default, profile, {
            excludeExtraneousValues: false,
        });
    }
    async modifyProfileServiceStatus(modifyProfileRequestDto) {
        let profile = await this.profileRepository.findOneBy({
            userId: modifyProfileRequestDto.userId,
        });
        if (!profile) {
            profile = this.profileRepository.create({ userId: modifyProfileRequestDto.userId });
        }
        const updateData = (0, utils_1.filterNullValues)(modifyProfileRequestDto);
        Object.assign(profile, updateData);
        const savedProfile = await this.profileRepository.save(profile);
        return (0, class_transformer_1.plainToInstance)(get_profile_response_dto_1.default, savedProfile, {
            excludeExtraneousValues: false,
        });
    }
};
exports.DetailService = DetailService;
exports.DetailService = DetailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(profile_1.default)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], DetailService);
//# sourceMappingURL=detail.service.js.map