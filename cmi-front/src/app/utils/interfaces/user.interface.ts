export interface IUser {
    _id?: string;
    fullName: string;
    username: string;
    password: string;
    projects: any[];
    deleted: boolean;
}