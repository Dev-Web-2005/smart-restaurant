"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentEnum = exports.TokenTypeEnum = exports.AuthorityEnum = exports.RoleEnum = void 0;
var RoleEnum;
(function (RoleEnum) {
    RoleEnum[RoleEnum["ADMIN"] = 1] = "ADMIN";
    RoleEnum[RoleEnum["USER"] = 2] = "USER";
    RoleEnum[RoleEnum["CHEF"] = 3] = "CHEF";
    RoleEnum[RoleEnum["STAFF"] = 4] = "STAFF";
    RoleEnum[RoleEnum["MANAGER"] = 5] = "MANAGER";
    RoleEnum[RoleEnum["CUSTOMER"] = 6] = "CUSTOMER";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var AuthorityEnum;
(function (AuthorityEnum) {
    AuthorityEnum[AuthorityEnum["READ"] = 1] = "READ";
    AuthorityEnum[AuthorityEnum["WRITE"] = 2] = "WRITE";
    AuthorityEnum[AuthorityEnum["DELETE"] = 3] = "DELETE";
    AuthorityEnum[AuthorityEnum["UPDATE"] = 4] = "UPDATE";
    AuthorityEnum[AuthorityEnum["EXECUTE"] = 5] = "EXECUTE";
    AuthorityEnum[AuthorityEnum["CREATE"] = 6] = "CREATE";
    AuthorityEnum[AuthorityEnum["VIEW"] = 7] = "VIEW";
    AuthorityEnum[AuthorityEnum["MANAGE"] = 8] = "MANAGE";
    AuthorityEnum[AuthorityEnum["MODIFY_STATE"] = 9] = "MODIFY_STATE";
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