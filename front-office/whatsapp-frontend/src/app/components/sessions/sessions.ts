import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { WhatsappApiService, Session } from '../../services/whatsapp-api.service';
import { Observable } from 'rxjs';
import { QrDialogComponent } from '../qr-dialog/qr-dialog';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    RouterModule
  ],
  templateUrl: './sessions.html',
  styleUrls: ['./sessions.scss']
})
export class SessionsComponent implements OnInit {
  sessions$: Observable<Session[]>;
  loading = false;
  newSession = {
    sessionId: '',
    webhookUrl: ''
  };

  constructor(
    private whatsappApi: WhatsappApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.sessions$ = this.whatsappApi.sessions$;
  }

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading = true;
    this.whatsappApi.loadSessions();
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  createSession(): void {
    if (!this.newSession.sessionId.trim()) {
      this.snackBar.open('Session ID is required', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.whatsappApi.startSession(
      this.newSession.sessionId,
      this.newSession.webhookUrl || undefined
    ).subscribe({
      next: (response) => {
        console.log('Session created:', response);
        this.snackBar.open('Session created successfully', 'Close', { duration: 3000 });
        this.loadSessions();
        this.newSession = { sessionId: '', webhookUrl: '' };
        
        // Show QR code dialog
        this.showQRCode(this.newSession.sessionId);
      },
      error: (error) => {
        console.error('Error creating session:', error);
        this.snackBar.open('Error creating session: ' + error.error?.message, 'Close', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  showQRCode(sessionId: string): void {
    this.whatsappApi.getQRCode(sessionId).subscribe({
      next: (response) => {
        if (response.success && response.qrCode) {
          this.dialog.open(QrDialogComponent, {
            data: { qrCode: response.qrCode, sessionId },
            width: '400px'
          });
        } else {
          this.snackBar.open('QR code not available yet. Please wait a moment.', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error getting QR code:', error);
        this.snackBar.open('Error getting QR code', 'Close', { duration: 3000 });
      }
    });
  }

  getStatus(sessionId: string): void {
    this.whatsappApi.getStatus(sessionId).subscribe({
      next: (response) => {
        console.log('Status:', response);
        this.snackBar.open(`Status: ${response.status}`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error getting status:', error);
        this.snackBar.open('Error getting status', 'Close', { duration: 3000 });
      }
    });
  }

  deleteSession(sessionId: string): void {
    if (confirm(`Are you sure you want to delete session "${sessionId}"?`)) {
      this.loading = true;
      this.whatsappApi.cleanupSession(sessionId).subscribe({
        next: (response) => {
          console.log('Session deleted:', response);
          this.snackBar.open('Session deleted successfully', 'Close', { duration: 3000 });
          this.loadSessions();
        },
        error: (error) => {
          console.error('Error deleting session:', error);
          this.snackBar.open('Error deleting session', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  setWebhook(sessionId: string, webhookUrl: string): void {
    this.whatsappApi.setWebhook(sessionId, webhookUrl).subscribe({
      next: (response) => {
        console.log('Webhook set:', response);
        this.snackBar.open('Webhook configured successfully', 'Close', { duration: 3000 });
        this.loadSessions();
      },
      error: (error) => {
        console.error('Error setting webhook:', error);
        this.snackBar.open('Error setting webhook', 'Close', { duration: 3000 });
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