import { PublicService } from './public.service';
import { GetPublicMenuRequestDto } from './dtos/request/get-public-menu-request.dto';
import HttpResponse from '@shared/utils/http-response';
export declare class PublicController {
    private readonly publicService;
    constructor(publicService: PublicService);
    getPublicMenu(dto: GetPublicMenuRequestDto): Promise<HttpResponse>;
}
