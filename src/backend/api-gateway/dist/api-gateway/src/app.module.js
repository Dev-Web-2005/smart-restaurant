"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const microservices_1 = require("@nestjs/microservices");
const identity_controller_1 = require("./services/identity/identity.controller");
const config_1 = require("@nestjs/config");
const logger_middleware_1 = require("./common/middleware/logger/logger.middleware");
const profile_controller_1 = require("./services/profile/profile.controller");
const rate_limit_middleware_1 = require("./common/middleware/rate-limit/rate-limit.middleware");
const table_controller_1 = require("./services/table/table.controller");
const floor_controller_1 = require("./services/table/floor.controller");
const product_controller_1 = require("./services/product/product.controller");
const public_url_middleware_1 = require("./common/middleware/public-url/public-url.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(logger_middleware_1.LoggerMiddleware, public_url_middleware_1.PublicUrlMiddleware, rate_limit_middleware_1.RateLimitMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            microservices_1.ClientsModule.register([
                {
                    name: 'IDENTITY_SERVICE',
                    transport: microservices_1.Transport.TCP,
                    options: {
                        host: process.env.HOST_IDENTITY_SERVICE || 'localhost',
                        port: +process.env.PORT_IDENTITY_SERVICE || 8080,
                    },
                },
                {
                    name: 'PROFILE_SERVICE',
                    transport: microservices_1.Transport.TCP,
                    options: {
                        host: process.env.HOST_PROFILE_SERVICE || 'localhost',
                        port: +process.env.PORT_PROFILE_SERVICE || 8081,
                    },
                },
                {
                    name: 'PRODUCT_SERVICE',
                    transport: microservices_1.Transport.TCP,
                    options: {
                        host: process.env.HOST_PRODUCT_SERVICE || 'localhost',
                        port: +process.env.PORT_PRODUCT_SERVICE || 8082,
                    },
                },
                {
                    name: 'TABLE_SERVICE',
                    transport: microservices_1.Transport.TCP,
                    options: {
                        host: process.env.HOST_TABLE_SERVICE || 'localhost',
                        port: +process.env.PORT_TABLE_SERVICE || 8083,
                    },
                },
            ]),
        ],
        controllers: [
            app_controller_1.AppController,
            identity_controller_1.IdentityController,
            profile_controller_1.ProfileController,
            table_controller_1.TableController,
            floor_controller_1.FloorController,
            product_controller_1.ProductController,
        ],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map