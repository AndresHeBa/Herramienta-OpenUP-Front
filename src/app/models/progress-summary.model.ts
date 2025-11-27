export interface ProgressSummary {
    projectId: string;
    totalCompletionPercent: number;
    progressByPhase: { [phase: string]: number };
    iterationsCount: number;
}
