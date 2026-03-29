import { ICard } from './card.interface';
import { ICategory } from './category.interface';

export interface IClassification {
    _id?: string;
    name: string;
    indication?: string;
    deleted: boolean;
    participantId?: string;
    closed: boolean;
    code: number;
    categories: ICategory[];
}