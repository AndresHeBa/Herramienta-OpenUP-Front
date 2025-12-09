export interface TestCase {
  _id: string;
  projectId: string;
  name: string;
  description: string;
  artifactId?: string;
  artifactName?: string;
  preconditions: string;
  steps: TestStep[];
  expectedResult: string;
  priority: 'Alta' | 'Media' | 'Baja';
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
}

export interface TestExecution {
  _id: string;
  testCaseId: string;
  projectId: string;
  executedBy: string;
  executedAt: Date;
  status: 'Pasó' | 'Falló' | 'Bloqueado' | 'No Ejecutado';
  actualResult?: string;
  evidence?: string; // URL o descripción de la evidencia
  notes?: string;
  iteration?: string;
  defectIds?: string[]; // IDs de defectos relacionados
}
