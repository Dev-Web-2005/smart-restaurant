"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Role;
const common_1 = require("@nestjs/common");
const app_exception_1 = __importDefault(require("../../../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../../../shared/src/exceptions/error-code"));
function Role(...roles) {
    let CheckRoleGuard = class CheckRoleGuard {
        canActivate(context) {
            const request = context.switchToHttp().getRequest();
            const user = request.user;
            if (!user || !user.roles) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            const userRoles = user.roles;
            console.log('User roles:', userRoles);
            for (const role of roles) {
                if (userRoles.includes(role)) {
                    return true;
                }
            }
            throw new app_exception_1.default(error_code_1.default.FORBIDDEN || error_code_1.default.UNAUTHORIZED);
        }
    };
    CheckRoleGuard = __decorate([
        (0, common_1.Injectable)()
    ], CheckRoleGuard);
    return new CheckRoleGuard();
}
//# sourceMappingURL=check-role.guard.js.map