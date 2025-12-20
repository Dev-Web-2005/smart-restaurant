"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentEnum = exports.TokenTypeEnum = exports.AuthorityEnum = exports.RoleEnum = void 0;
var RoleEnum;
(function (RoleEnum) {
    RoleEnum[RoleEnum["ADMIN"] = 1] = "ADMIN";
    RoleEnum[RoleEnum["USER"] = 2] = "USER";
    RoleEnum[RoleEnum["STAFF"] = 3] = "STAFF";
    RoleEnum[RoleEnum["MANAGER"] = 4] = "MANAGER";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var AuthorityEnum;
(function (AuthorityEnum) {
    AuthorityEnum[AuthorityEnum["READ"] = 1] = "READ";
    AuthorityEnum[AuthorityEnum["WRITE"] = 2] = "WRITE";
    AuthorityEnum[AuthorityEnum["DELETE"] = 3] = "DELETE";
    AuthorityEnum[AuthorityEnum["UPDATE"] = 4] = "UPDATE";
    AuthorityEnum[AuthorityEnum["EXECUTE"] = 5] = "EXECUTE";
})(AuthorityEnum || (exports.AuthorityEnum = AuthorityEnum = {}));
var TokenTypeEnum;
(function (TokenTypeEnum) {
    TokenTypeEnum["ACCESS"] = "access";
    TokenTypeEnum["REFRESH"] = "refresh";
})(TokenTypeEnum || (exports.TokenTypeEnum = TokenTypeEnum = {}));
var EnvironmentEnum;
(function (EnvironmentEnum) {
    EnvironmentEnum["DEVELOPMENT"] = "development";
    EnvironmentEnum["PRODUCTION"] = "production";
})(EnvironmentEnum || (exports.EnvironmentEnum = EnvironmentEnum = {}));
//# sourceMappingURL=enum.js.map