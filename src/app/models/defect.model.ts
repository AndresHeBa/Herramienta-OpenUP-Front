export interface Defect {
  _id: string;
  defectId: string; // ID único del defecto (ej: DEF-001)
  projectId: string;
  title: string;
  description: string;
  severity: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  status: 'Abierto' | 'En Progreso' | 'Resuelto' | 'Cerrado' | 'Reabierto';
  priority: 'Urgente' | 'Alta' | 'Media' | 'Baja';
  
  // Vinculación
  testCaseId?: string;
  testExecutionId?: string;
  artifactId?: string;
  artifactName?: string;
  artifactVersion?: string;
  
  // Asignación y seguimiento
  reportedBy: string;
  assignedTo?: string;
  reportedAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  
  // Detalles técnicos
  stepsToReproduce?: string;
  environment?: string;
  attachments?: string[];
  
  // Historial
  comments?: DefectComment[];
  history?: DefectHistoryEntry[];
}

export interface DefectComment {
  author: string;
  comment: string;
  createdAt: Date;
}

export interface DefectHistoryEntry {
  changedBy: string;
  changedAt: Date;
  field: string;
  oldValue: string;
  newValue: string;
}
