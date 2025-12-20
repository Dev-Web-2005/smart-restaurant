"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        console.log('GlobalExceptionFilter caught exception:', {
            type: exception?.constructor?.name,
            isRpcException: exception instanceof microservices_1.RpcException,
            error: exception instanceof microservices_1.RpcException ? exception.getError() : exception,
        });
        if (exception instanceof microservices_1.RpcException) {
            const error = exception.getError();
            if (typeof error === 'object' && error !== null) {
                const errorObj = error;
                const statusCode = typeof errorObj.status === 'number'
                    ? errorObj.status
                    : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                const code = typeof errorObj.code === 'number' ? errorObj.code : statusCode;
                return response.status(statusCode).json({
                    code: code,
                    message: errorObj.message || 'Internal server error',
                    errors: errorObj.errors,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                });
            }
            return response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                code: 9999,
                message: typeof error === 'string' ? error : 'Internal server error',
                timestamp: new Date().toISOString(),
                path: request.url,
            });
        }
        if (typeof exception === 'object' && exception !== null && exception.error) {
            const errorObj = exception.error;
            if (typeof errorObj === 'object' && errorObj !== null) {
                const statusCode = typeof errorObj.status === 'number'
                    ? errorObj.status
                    : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                const code = typeof errorObj.code === 'number' ? errorObj.code : statusCode;
                return response.status(statusCode).json({
                    code: code,
                    message: errorObj.message || 'Internal server error',
                    errors: errorObj.errors,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                });
            }
        }
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        if (typeof exception.status === 'number') {
            status = exception.status;
        }
        else if (typeof exception.code === 'number') {
            status = exception.code;
        }
        const message = exception.message || 'Internal server error';
        const errorResponse = {
            code: typeof exception.code === 'number' ? exception.code : status,
            message: message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        if (exception.errors) {
            errorResponse.errors = exception.errors;
        }
        if (exception.data) {
            errorResponse.data = exception.data;
        }
        response.status(status).json(errorResponse);
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map