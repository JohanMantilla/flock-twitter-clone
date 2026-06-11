export class SafeTweetAuthorDto {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
}

export class SafeTweetDto {
    id: string;
    content: string;
    likesCount: number;
    likes: any[];
    createdAt: Date;
    updatedAt: Date;
    user: SafeTweetAuthorDto;
}