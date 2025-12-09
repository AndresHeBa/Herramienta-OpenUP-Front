// Modelos para la configuración del modelo OpenUP

export interface Role {
  _id?: string;
  name: string;
  description: string;
  responsibilities: string[];
  active: boolean;
}

export interface Phase {
  _id?: string;
  name: string;
  description: string;
  objectives: string[];
  order: number;
  active: boolean;
}

export interface ArtifactType {
  _id?: string;
  name: string;
  description: string;
  phase: string;
  required: boolean;
  customFields?: CustomField[];
  active: boolean;
}

export interface CustomField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // Para tipo 'select'
  defaultValue?: any;
}

export interface Workflow {
  _id?: string;
  name: string;
  description: string;
  phases: string[];
  steps: WorkflowStep[];
  active: boolean;
}

export interface WorkflowStep {
  order: number;
  name: string;
  description: string;
  responsibleRole: string;
  artifacts: string[];
  duration?: number; // días estimados
}

export interface Permission {
  action: string;
  roles: string[];
}

export interface OpenUPConfiguration {
  _id?: string;
  version: number;
  name: string;
  description: string;
  creationDate: Date;
  createdBy: string;
  roles: Role[];
  phases: Phase[];
  artifactTypes: ArtifactType[];
  workflows: Workflow[];
  permissions?: Permission[];
  active: boolean;
}

export interface ConfigurationHistory {
  _id?: string;
  configurationId: string;
  version: number;
  changeDate: Date;
  changedBy: string;
  changeDescription: string;
  previousConfiguration: OpenUPConfiguration;
}
