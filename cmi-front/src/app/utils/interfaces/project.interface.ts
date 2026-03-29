export interface IProject {
    _id?: string;
    name: string;
    minOpenQuestionsCnt: number;
    introductionText: string;
    deleted: boolean;
}