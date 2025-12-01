import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActiveProjectService {
  private activeProjectSubject = new BehaviorSubject<string | null>(null);

  setActiveProject(projectIdentifier: string | null) {
    this.activeProjectSubject.next(projectIdentifier);
  }

  getActiveProject(): Observable<string | null> {
    return this.activeProjectSubject.asObservable();
  }

  getCurrent(): string | null {
    return this.activeProjectSubject.value;
  }
}
