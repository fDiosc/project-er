export enum ArtifactType {
    CHART = 'chart',
    TABLE = 'table',
    SCORECARD = 'scorecard'
}

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
    }[];
}

export interface TableData {
    columns: { header: string; field: string }[];
    rows: any[];
}

export interface ScorecardMetric {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export interface Insight {
    title: string;
    description: string;
    type: 'warning' | 'opportunity' | 'action';
    kcsPrinciple?: string;
}

export interface Artifact {
    type: ArtifactType;
    title: string;
    description?: string;
    chartType?: 'bar' | 'line' | 'pie' | 'area';
    data: ChartData | TableData | ScorecardMetric[];
    insights?: Insight[];
    followUpQuestions?: string[];
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    artifact?: Artifact;
    attempts?: number;
}
