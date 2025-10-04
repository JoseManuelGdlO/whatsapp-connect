import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WhatsappApiService, Session } from '../../services/whatsapp-api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-webhook-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './webhook-manager.html',
  styleUrls: ['./webhook-manager.scss']
})
export class WebhookManagerComponent implements OnInit {
  sessions$: Observable<Session[]>;
  loading = false;
  webhookTests: { [sessionId: string]: boolean } = {};
  
  webhookExample = `{
  "sessionId": "mi-sesion",
  "message": {
    "id": "3EB0C767D26A8B4A4A4A",
    "from": "5511999999999@c.us",
    "to": "5511888888888@c.us",
    "body": "Hello from WhatsApp!",
    "type": "chat",
    "timestamp": 1640995200,
    "notifyName": "John Doe",
    "fromMe": false,
    "chat": "5511999999999@c.us",
    "receivedAt": "2023-01-01T12:00:00.000Z"
  }
}`;

  constructor(
    private whatsappApi: WhatsappApiService,
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

  setWebhook(sessionId: string, webhookUrl: string): void {
    if (!webhookUrl.trim()) {
      this.snackBar.open('Webhook URL is required', 'Close', { duration: 3000 });
      return;
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      this.snackBar.open('Please enter a valid URL', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.whatsappApi.setWebhook(sessionId, webhookUrl).subscribe({
      next: (response) => {
        console.log('Webhook set:', response);
        this.snackBar.open('Webhook configured successfully', 'Close', { duration: 3000 });
        this.loadSessions();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error setting webhook:', error);
        this.snackBar.open('Error setting webhook: ' + error.error?.message, 'Close', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  removeWebhook(sessionId: string): void {
    if (confirm(`Are you sure you want to remove the webhook for session "${sessionId}"?`)) {
      this.loading = true;
      this.whatsappApi.setWebhook(sessionId, '').subscribe({
        next: (response) => {
          console.log('Webhook removed:', response);
          this.snackBar.open('Webhook removed successfully', 'Close', { duration: 3000 });
          this.loadSessions();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error removing webhook:', error);
          this.snackBar.open('Error removing webhook', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  testWebhook(sessionId: string, webhookUrl: string | undefined): void {
    if (!webhookUrl) {
      this.snackBar.open('No webhook URL configured for this session', 'Close', { duration: 3000 });
      return;
    }

    this.webhookTests[sessionId] = true;
    
    // Send a test message to trigger webhook
    this.whatsappApi.sendMessage('1234567890', 'Test webhook message', sessionId).subscribe({
      next: (response) => {
        this.webhookTests[sessionId] = false;
        this.snackBar.open('Test message sent. Check your webhook endpoint.', 'Close', { duration: 5000 });
      },
      error: (error) => {
        this.webhookTests[sessionId] = false;
        this.snackBar.open('Error sending test message: ' + error.error?.message, 'Close', { duration: 5000 });
      }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard', 'Close', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 2000 });
    });
  }

  getWebhookStatus(webhookUrl: string | undefined): string {
    if (!webhookUrl) return 'Not configured';
    return 'Active';
  }

  getWebhookStatusClass(webhookUrl: string | undefined): string {
    if (!webhookUrl) return 'status-disconnected';
    return 'status-connected';
  }
}
