export default class HttpResponse {
    code: number;
    message: string;
    data?: any;
    constructor(code: number, message: string, data?: any);
    toJSON(): {
        code: number;
        message: string;
        data: any;
    };
}
