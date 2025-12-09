import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditLog, AuditFilters } from '../service/audit.service';

@Component({
  selector: 'app-audit-viewer',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-viewer.component.html',
  styleUrl: './audit-viewer.component.css'
})
export class AuditViewerComponent implements OnInit {
  @Input() projectId?: string;
  @Input() entityType?: string;
  @Input() entityId?: string;

  logs: AuditLog[] = [];
  isLoading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalPages = 1;
  totalCount = 0;

  // Filters
  filters: AuditFilters = {
    limit: 50,
    skip: 0,
    sortField: 'timestamp',
    sortOrder: -1
  };

  actionTypeFilter: string = '';
  entityTypeFilter: string = '';
  startDateFilter: string = '';
  endDateFilter: string = '';

  // Stats
  showStats = false;
  stats: any = null;

  constructor(public auditService: AuditService) {}

  ngOnInit(): void {
    // Set initial filters from Input properties
    if (this.projectId) {
      this.filters.projectId = this.projectId;
    }
    if (this.entityType && this.entityId) {
      this.filters.entityType = this.entityType;
      this.filters.entityId = this.entityId;
    }

    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.error = null;

    // Update filters with current values
    this.filters.skip = (this.currentPage - 1) * this.pageSize;
    this.filters.limit = this.pageSize;

    if (this.actionTypeFilter) {
      this.filters.actionType = this.actionTypeFilter.split(',').map(s => s.trim());
    } else {
      delete this.filters.actionType;
    }

    if (this.entityTypeFilter) {
      this.filters.entityType = this.entityTypeFilter.split(',').map(s => s.trim());
    } else if (!this.entityType) {
      delete this.filters.entityType;
    }

    if (this.startDateFilter) {
      this.filters.startDate = this.startDateFilter;
    } else {
      delete this.filters.startDate;
    }

    if (this.endDateFilter) {
      this.filters.endDate = this.endDateFilter;
    } else {
      delete this.filters.endDate;
    }

    this.auditService.getAuditLogs(this.filters).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          this.logs = response.Result.logs;
          this.totalCount = response.Result.totalCount;
          this.totalPages = response.Result.totalPages;
          this.currentPage = response.Result.page;
        } else {
          this.error = response.strMessage;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading audit logs:', err);
        this.error = 'Error al cargar los registros de auditoría';
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    if (!this.showStats) {
      this.showStats = true;
      
      this.auditService.getAuditStats(
        this.filters.projectId,
        this.filters.startDate,
        this.filters.endDate
      ).subscribe({
        next: (response) => {
          if (response.intCode === 200) {
            this.stats = response.Result;
          }
        },
        error: (err) => {
          console.error('Error loading stats:', err);
        }
      });
    } else {
      this.showStats = false;
    }
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  clearFilters(): void {
    this.actionTypeFilter = '';
    this.entityTypeFilter = '';
    this.startDateFilter = '';
    this.endDateFilter = '';

    // Keep projectId and entity filters from Input properties
    this.filters = {
      limit: 50,
      skip: 0,
      sortField: 'timestamp',
      sortOrder: -1
    };

    if (this.projectId) {
      this.filters.projectId = this.projectId;
    }
    if (this.entityType && this.entityId) {
      this.filters.entityType = this.entityType;
      this.filters.entityId = this.entityId;
    }

    this.currentPage = 1;
    this.loadLogs();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadLogs();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLogs();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadLogs();
    }
  }

  exportJSON(): void {
    this.auditService.exportAuditLogsJSON(this.filters).subscribe({
      next: (response) => {
        if (response.intCode === 200) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          this.auditService.downloadJSON(
            response.Result.data,
            `audit_logs_${timestamp}.json`
          );
        }
      },
      error: (err) => {
        console.error('Error exporting JSON:', err);
        alert('Error al exportar logs en JSON');
      }
    });
  }

  exportCSV(): void {
    this.auditService.exportAuditLogsCSV(this.filters).subscribe({
      next: (blob) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.auditService.downloadBlob(blob, `audit_logs_${timestamp}.csv`);
      },
      error: (err) => {
        console.error('Error exporting CSV:', err);
        alert('Error al exportar logs en CSV');
      }
    });
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getDetailsString(details: any): string {
    if (!details || Object.keys(details).length === 0) {
      return '-';
    }
    return JSON.stringify(details, null, 2);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    const halfMax = Math.floor(maxPages / 2);

    let startPage = Math.max(1, this.currentPage - halfMax);
    let endPage = Math.min(this.totalPages, this.currentPage + halfMax);

    // Adjust if we're near the start or end
    if (this.currentPage <= halfMax) {
      endPage = Math.min(this.totalPages, maxPages);
    }
    if (this.currentPage > this.totalPages - halfMax) {
      startPage = Math.max(1, this.totalPages - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
