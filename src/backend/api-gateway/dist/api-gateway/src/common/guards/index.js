"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = exports.CheckRoleGuard = void 0;
var check_role_guard_1 = require("./check-role/check-role.guard");
Object.defineProperty(exports, "CheckRoleGuard", { enumerable: true, get: function () { return __importDefault(check_role_guard_1).default; } });
var auth_guard_1 = require("./get-role/auth.guard");
Object.defineProperty(exports, "AuthGuard", { enumerable: true, get: function () { return auth_guard_1.AuthGuard; } });
//# sourceMappingURL=index.js.map