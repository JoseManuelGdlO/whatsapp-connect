import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { WhatsappApiService, Session } from '../../services/whatsapp-api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  sessions$: Observable<Session[]>;
  loading = false;
  stats = {
    totalSessions: 0,
    connectedSessions: 0,
    disconnectedSessions: 0
  };

  constructor(private whatsappApi: WhatsappApiService) {
    this.sessions$ = this.whatsappApi.sessions$;
  }

  ngOnInit(): void {
    this.loadSessions();
    this.sessions$.subscribe(sessions => {
      this.updateStats(sessions);
    });
  }

  loadSessions(): void {
    this.loading = true;
    this.whatsappApi.loadSessions();
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  updateStats(sessions: Session[]): void {
    this.stats.totalSessions = sessions.length;
    this.stats.connectedSessions = sessions.filter(s => s.status === 'CONNECTED').length;
    this.stats.disconnectedSessions = sessions.filter(s => s.status === 'DISCONNECTED').length;
  }

  restoreSessions(): void {
    this.loading = true;
    this.whatsappApi.restoreSessions().subscribe({
      next: (response) => {
        console.log('Sessions restored:', response);
        this.loadSessions();
      },
      error: (error) => {
        console.error('Error restoring sessions:', error);
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'CONNECTED': return 'status-connected';
      case 'DISCONNECTED': return 'status-disconnected';
      case 'WAITING_FOR_QR': return 'status-waiting';
      default: return '';
    }
  }
}