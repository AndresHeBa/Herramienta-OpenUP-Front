import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestCase, TestExecution } from '../models/test-case.model';
import { Defect } from '../models/defect.model';

const API_URL = 'http://localhost:6002/api';

@Injectable({
  providedIn: 'root'
})
export class QualityService {
  constructor(private http: HttpClient) {}

  // Test Cases
  createTestCase(testCase: Partial<TestCase>): Observable<any> {
    return this.http.post<any>(`${API_URL}/test/createTestCase`, testCase);
  }

  getTestCasesByProject(projectId: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/test/getTestCases/${projectId}`);
  }

  executeTestCase(execution: Partial<TestExecution>): Observable<any> {
    return this.http.post<any>(`${API_URL}/test/executeTestCase`, execution);
  }

  getTestExecutionsByProject(projectId: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/test/getExecutions/${projectId}`);
  }

  getTestExecutionsByTestCase(testCaseId: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/test/getExecutions/testCase/${testCaseId}`);
  }

  // Defects
  createDefect(defect: Partial<Defect>): Observable<any> {
    return this.http.post<any>(`${API_URL}/defect/createDefect`, defect);
  }

  getDefectsByProject(projectId: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/defect/getDefects/${projectId}`);
  }

  getDefectById(defectId: string): Observable<any> {
    return this.http.get<any>(`${API_URL}/defect/getDefect/${defectId}`);
  }

  updateDefect(defectId: string, updates: any, changedBy: string): Observable<any> {
    return this.http.put<any>(`${API_URL}/defect/updateDefect/${defectId}`, { ...updates, changedBy });
  }

  addCommentToDefect(defectId: string, author: string, comment: string): Observable<any> {
    return this.http.post<any>(`${API_URL}/defect/addComment/${defectId}`, { author, comment });
  }
}
