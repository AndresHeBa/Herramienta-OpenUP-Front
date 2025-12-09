import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExportImportService {
  private baseUrl = 'http://localhost:6002/api';

  constructor(private http: HttpClient) {}

  /**
   * Export project as ZIP or JSON
   */
  exportProject(projectId: string, format: 'zip' | 'json' = 'zip', includeFiles: boolean = true): Observable<any> {
    const url = `${this.baseUrl}/export/project/${projectId}?format=${format}&includeFiles=${includeFiles}`;
    
    if (format === 'zip') {
      // For ZIP, we need to handle blob response
      return this.http.get(url, {
        responseType: 'blob',
        observe: 'response'
      });
    } else {
      // For JSON, regular response
      return this.http.get(url);
    }
  }

  /**
   * Import project from template data
   */
  importProjectFromTemplate(templateData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/import/project`, {
      templateData: templateData
    });
  }

  /**
   * Import project from uploaded file
   */
  importProjectFromFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.baseUrl}/import/project`, formData);
  }

  /**
   * Export configuration as template
   */
  exportConfiguration(configId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/export/configuration/${configId}`);
  }

  /**
   * Helper: Download blob as file
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper: Download JSON as file
   */
  downloadJSON(data: any, filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }
}
