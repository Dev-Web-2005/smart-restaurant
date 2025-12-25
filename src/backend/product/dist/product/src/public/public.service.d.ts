import { Repository } from 'typeorm';
import { MenuCategory, MenuItem } from 'src/common/entities';
import { GetPublicMenuRequestDto } from './dtos/request/get-public-menu-request.dto';
import { GetPublicMenuResponseDto, PaginatedPublicMenuResponseDto } from './dtos/response/public-menu-response.dto';
export declare class PublicService {
    private readonly categoryRepository;
    private readonly itemRepository;
    constructor(categoryRepository: Repository<MenuCategory>, itemRepository: Repository<MenuItem>);
    getPublicMenu(dto: GetPublicMenuRequestDto): Promise<GetPublicMenuResponseDto | PaginatedPublicMenuResponseDto>;
    private getGroupedPublicMenu;
    private getPaginatedPublicMenu;
    private toPublicItemDto;
}
