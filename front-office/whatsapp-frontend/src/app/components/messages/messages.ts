import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { WhatsappApiService, Message } from '../../services/whatsapp-api.service';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-messages',
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
    MatTabsModule
  ],
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss']
})
export class MessagesComponent implements OnInit {
  sessionId: string = '';
  messages: Message[] = [];
  loading = false;
  sending = false;
  newMessage = {
    phone: '',
    message: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private whatsappApi: WhatsappApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    if (this.sessionId) {
      this.loadMessages();
      // Auto-refresh messages every 10 seconds
      interval(10000).pipe(
        startWith(0),
        switchMap(() => this.whatsappApi.getMessages(this.sessionId))
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.messages = response.messages || [];
          }
        },
        error: (error) => {
          console.error('Error auto-refreshing messages:', error);
        }
      });
    }
  }

  loadMessages(): void {
    this.loading = true;
    this.whatsappApi.getMessages(this.sessionId).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages = response.messages || [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.snackBar.open('Error loading messages', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.phone.trim() || !this.newMessage.message.trim()) {
      this.snackBar.open('Phone number and message are required', 'Close', { duration: 3000 });
      return;
    }

    this.sending = true;
    this.whatsappApi.sendMessage(
      this.newMessage.phone,
      this.newMessage.message,
      this.sessionId
    ).subscribe({
      next: (response) => {
        console.log('Message sent:', response);
        this.snackBar.open('Message sent successfully', 'Close', { duration: 3000 });
        this.newMessage = { phone: '', message: '' };
        this.loadMessages(); // Refresh messages
        this.sending = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.snackBar.open('Error sending message: ' + error.error?.message, 'Close', { duration: 5000 });
        this.sending = false;
      }
    });
  }

  formatPhone(phone: string): string {
    // Remove @c.us suffix and format phone number
    return phone.replace('@c.us', '').replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '($1) $2 $3-$4');
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  goBack(): void {
    this.router.navigate(['/sessions']);
  }
}