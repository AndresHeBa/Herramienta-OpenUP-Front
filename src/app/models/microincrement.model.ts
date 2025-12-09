export interface Microincremento {
  _id?: string;
  projectId: string;
  iteration: string;
  deliverable: string;
  title: string;
  description: string;
  date: string;
  author: string;
  status?: string;
  creationDate?: string;
  type?: 'técnico' | 'funcional'; // Nuevo campo para HU-017
  evidence?: string; // Nuevo campo para archivo o enlace
  value?: number; // Nuevo campo para registrar valor (0-10)
}
