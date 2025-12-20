"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenResponseDto = void 0;
class RefreshTokenResponseDto {
    accessToken;
    userId;
    username;
    email;
    roles;
    constructor(partial) {
        Object.assign(this, partial);
    }
}
exports.RefreshTokenResponseDto = RefreshTokenResponseDto;
//# sourceMappingURL=refresh-token-response.dto.js.map