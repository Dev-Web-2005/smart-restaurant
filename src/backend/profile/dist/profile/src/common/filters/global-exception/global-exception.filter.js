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
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const app_exception_1 = __importDefault(require("../../../../../shared/src/exceptions/app-exception"));
let GlobalExceptionFilter = class GlobalExceptionFilter extends microservices_1.BaseRpcExceptionFilter {
    catch(exception, host) {
        if (exception instanceof app_exception_1.default) {
            const errorCode = exception.getErrorCode();
            return super.catch(new microservices_1.RpcException({
                code: errorCode.code,
                message: errorCode.message,
                status: errorCode.httpStatus,
            }), host);
        }
        if (exception instanceof microservices_1.RpcException) {
            return super.catch(exception, host);
        }
        console.error('Unhandled exception:', exception);
        const response = {
            code: 9999,
            message: 'Internal server error',
            status: 500,
            error: exception?.message || null,
        };
        return super.catch(new microservices_1.RpcException(response), host);
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map