"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = __importDefault(require("express"));
const rpc_exception_filter_1 = require("./common/filters/rpc-exception.filter");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const transform_response_interceptor_1 = require("./common/interceptors/transform-response.interceptor");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1', {
        exclude: ['/', 'health'],
    });
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
    app.useGlobalFilters(new rpc_exception_filter_1.RpcExceptionFilter(), new global_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new transform_response_interceptor_1.TransformResponseInterceptor());
    const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
        : ['http://localhost:5173', 'http://localhost:3000'];
    console.log('🔐 CORS Allowed Origins:', allowedOrigins);
    app.enableCors({
        origin: (origin, callback) => {
            console.log('📨 Request from origin:', origin);
            if (!origin) {
                console.log('✅ No origin - allowing request');
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                console.log('✅ Origin allowed:', origin);
                callback(null, true);
            }
            else {
                console.log('❌ Origin blocked:', origin);
                console.log('   Allowed origins:', allowedOrigins);
                callback(null, true);
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Authorization,x-api-key',
        exposedHeaders: 'Set-Cookie',
    });
    app.use((0, cookie_parser_1.default)());
    await app.listen(parseInt(process.env.PORT, 10) ?? 8888);
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
    console.log(`API Gateway is running on port ${process.env.PORT || 8888}`);
})
    .catch((err) => {
    console.error('Error starting API Gateway', err);
});
//# sourceMappingURL=main.js.map