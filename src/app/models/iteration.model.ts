export interface Task {
    name: string;
    completed: boolean;
}

export interface Iteration {
    _id: string;
    projectId: string;
    iteration: string;
    startDate: string;
    endDate: string;
    tasks: Task[];
    completionPercent: number;
    blockers: string;
    observations: string;
    creationDate: Date;
    version: number;
    status: string;
    goal: string;
    phase: string;
    active: boolean;
}
