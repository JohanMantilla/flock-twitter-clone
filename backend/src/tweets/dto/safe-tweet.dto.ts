export class SafeTweetAuthorDto {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
}

export class SafeTweetDto {
    id: string;
    content: string;
    likesCount: number;
    liked: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: SafeTweetAuthorDto;
}