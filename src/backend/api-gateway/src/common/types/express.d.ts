import { RequestUser } from '@shared/types';

declare global {
	namespace Express {
		interface Request {
			user?: RequestUser;
		}
	}
}
