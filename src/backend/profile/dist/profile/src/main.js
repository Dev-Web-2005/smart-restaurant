"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const microservices_1 = require("@nestjs/microservices");
const common_1 = require("@nestjs/common");
const error_code_1 = __importDefault(require("../../shared/src/exceptions/error-code"));
const global_exception_filter_1 = require("./common/filters/global-exception/global-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = parseInt(process.env.PORT, 10);
    app.connectMicroservice({
        transport: microservices_1.Transport.TCP,
        options: {
            port: port,
        },
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
            const messages = errors.map((err) => {
                return {
                    [err.property]: Object.values(err.constraints),
                };
            });
            throw new microservices_1.RpcException({
                code: error_code_1.default.VALIDATION_FAILED.code,
                message: 'Validation failed',
                status: error_code_1.default.VALIDATION_FAILED.httpStatus,
                errors: messages,
            });
        },
    }));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    await app.startAllMicroservices();
    console.log(`Profile Service is running on TCP port ${port}`);
    await app.listen(port, '127.0.0.1');
    console.log(`HTTP Health endpoint listening on 127.0.0.1:${port}`);
    process.on('SIGINT', () => {
        console.log('SIGINT received. Shutting down gracefully...');
        app.close().then(() => process.exit(0));
    });
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        app.close().then(() => process.exit(0));
    });
}
bootstrap()
    .then(() => {
    console.log(`Microservice is running on port ${process.env.PORT}`);
})
    .catch((err) => {
    console.error('Error starting the microservice', err);
});
//# sourceMappingURL=main.js.map