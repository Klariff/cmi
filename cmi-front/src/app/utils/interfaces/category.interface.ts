import { ICard } from './card.interface';

export interface ICategory {
    _id?: string;
    name: string;
    classificationId?: string;
    code: number;
    cards: string[];
}