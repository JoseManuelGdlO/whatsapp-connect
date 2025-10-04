import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Session {
  sessionId: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'WAITING_FOR_QR';
  webhookUrl?: string;
  lastUpdated?: string;
  hasAuthData?: boolean;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  type: string;
  timestamp: number;
  notifyName: string;
  fromMe: boolean;
  chat: string;
  receivedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsappApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private sessionsSubject = new BehaviorSubject<Session[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSessions();
  }

  // Session Management
  startSession(sessionId: string, webhookUrl?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/start`, {
      sessionId,
      webhookUrl
    });
  }

  getSessions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/sessions`);
  }

  loadSessions(): void {
    this.getSessions().subscribe({
      next: (response) => {
        if (response.success) {
          this.sessionsSubject.next(response.sessions || []);
        }
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
      }
    });
  }

  // QR Code
  getQRCode(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/qrcode/${sessionId}`);
  }

  waitForQR(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/wait-qr/${sessionId}`);
  }

  // Status
  getStatus(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/status/${sessionId}`);
  }

  // Messages
  sendMessage(phone: string, message: string, sessionId: string = 'default'): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/send-message`, {
      phone,
      message,
      sessionId
    });
  }

  getMessages(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/messages/${sessionId}`);
  }

  // Webhooks
  setWebhook(sessionId: string, webhookUrl: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/webhook/${sessionId}`, {
      webhookUrl
    });
  }

  getWebhook(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/webhook/${sessionId}`);
  }

  // Cleanup
  cleanupSession(sessionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/cleanup/${sessionId}`);
  }

  cleanupAllSessions(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/cleanup/all`);
  }

  // Restore sessions
  restoreSessions(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/restore-sessions`, {});
  }
}
