export default class HttpResponse {
  code: number;
  message: string;
  data?: any;

  constructor(code: number, message: string, data?: any) {
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
