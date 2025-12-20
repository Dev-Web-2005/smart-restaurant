"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
let RpcExceptionFilter = class RpcExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const error = exception.getError();
        if (typeof error === 'object' && error !== null) {
            const errorObj = error;
            const statusCode = errorObj.status;
            return response.status(statusCode).json({
                code: errorObj.code,
                message: errorObj.message,
                errors: errorObj.errors,
                timestamp: new Date().toISOString(),
            });
        }
        return response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            code: 9999,
            message: typeof error === 'string' ? error : 'Internal server error',
            timestamp: new Date().toISOString(),
        });
    }
};
exports.RpcExceptionFilter = RpcExceptionFilter;
exports.RpcExceptionFilter = RpcExceptionFilter = __decorate([
    (0, common_1.Catch)(microservices_1.RpcException)
], RpcExceptionFilter);
//# sourceMappingURL=rpc-exception.filter.js.map