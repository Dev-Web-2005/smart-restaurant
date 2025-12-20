"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const microservices_1 = require("@nestjs/microservices");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const filters_1 = require("./common/filters");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') || 8082;
    app.connectMicroservice({
        transport: microservices_1.Transport.TCP,
        options: {
            port: port,
        },
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    app.useGlobalFilters(new filters_1.GlobalExceptionFilter(), new filters_1.CatchAppExceptionFilter());
    await app.startAllMicroservices();
    console.log(`🚀 Product Service is running on TCP port ${port}`);
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