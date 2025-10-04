import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-qr-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './qr-dialog.html',
  styleUrls: ['./qr-dialog.scss']
})
export class QrDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { qrCode: string, sessionId: string }
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onRefresh(): void {
    // Emit refresh event
    this.dialogRef.close('refresh');
  }
}