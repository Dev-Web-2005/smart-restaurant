"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerMiddleware = void 0;
const logger_1 = require("../../logger");
const common_1 = require("@nestjs/common");
let LoggerMiddleware = class LoggerMiddleware {
    use(req, res, next) {
        const startTime = Date.now();
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const method = req.method;
        const url = req.originalUrl || req.url;
        const userAgent = req.headers['user-agent'] || '';
        const originalSend = res.send;
        let responseBody;
        res.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const statusCode = res.statusCode;
            const logData = {
                timestamp: new Date().toISOString(),
                request: {
                    method: method,
                    url: url,
                    ip: String(ip),
                    userAgent: userAgent,
                    body: req.body || {},
                    query: req.query || {},
                    params: req.params || {},
                },
                response: {
                    statusCode: statusCode,
                    body: responseBody ? JSON.parse(responseBody) : null,
                },
                duration: `${duration}ms`,
            };
            if (statusCode >= 500) {
                logger_1.logger.error(JSON.stringify(logData, null, 2));
            }
            else if (statusCode >= 400) {
                logger_1.logger.warn(JSON.stringify(logData, null, 2));
            }
            else {
                logger_1.logger.info(JSON.stringify(logData, null, 2));
            }
        });
        next();
    }
};
exports.LoggerMiddleware = LoggerMiddleware;
exports.LoggerMiddleware = LoggerMiddleware = __decorate([
    (0, common_1.Injectable)()
], LoggerMiddleware);
//# sourceMappingURL=logger.middleware.js.map