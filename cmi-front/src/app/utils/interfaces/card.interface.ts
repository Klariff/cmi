export interface ICard {
    _id?: string;
    name: string;
    code: number;
    deleted: boolean;
    image: string;
    files?: string[];
    onlyShowImage?: boolean;
}