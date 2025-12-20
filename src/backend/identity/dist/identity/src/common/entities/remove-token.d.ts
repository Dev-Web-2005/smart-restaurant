export declare class RemoveToken {
    token: string;
    tokenType: 'access' | 'refresh';
    expiryDate: Date;
    createdAt: Date;
    userId?: string;
}
