"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpResponse {
    code;
    message;
    data;
    constructor(code, message, data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            data: this.data,
        };
    }
}
exports.default = HttpResponse;
//# sourceMappingURL=http-response.js.map