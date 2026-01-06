import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Notification } from '../../../core/models';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="notification-popup">
      <div class="popup-header">
        <div class="header-content">
          <div class="bell-wrapper">
            <mat-icon class="bell-icon">notifications_active</mat-icon>
            <span class="badge">{{ data.notifications.length }}</span>
          </div>
          <div class="header-text">
            <h2>New Notifications</h2>
            <p>You have {{ data.notifications.length }} unread message{{ data.notifications.length > 1 ? 's' : '' }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="popup-content">
        <div class="notification-card" 
             *ngFor="let notification of data.notifications; let i = index"
             [style.animation-delay]="i * 0.05 + 's'"
             [class]="'type-' + getTypeClass(notification.type)">
          <div class="card-indicator"></div>
          <div class="card-icon">
            <mat-icon [class]="getIconClass(notification.type)">{{ getIcon(notification.type) }}</mat-icon>
          </div>
          <div class="card-content">
            <div class="card-title">{{ notification.title }}</div>
            <div class="card-message">{{ notification.message }}</div>
            <div class="card-time">
              <mat-icon>schedule</mat-icon>
              {{ getTimeAgo(notification.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <div class="popup-footer">
        <button mat-button class="mark-read-btn" (click)="markAllRead()">
          <mat-icon>done_all</mat-icon>
          Mark all as read
        </button>
        <button mat-flat-button color="primary" class="view-all-btn" (click)="viewAll()">
          View All
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-popup {
      display: flex;
      flex-direction: column;
      max-height: 85vh;
      overflow: hidden;
      margin: -24px;
      border-radius: 0;
      background: white;
      min-width: 420px;
    }

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 28px 24px;
      background: #3D5A80;
      color: white;

      .header-content {
        display: flex;
        align-items: center;
        gap: 18px;

        .bell-wrapper {
          position: relative;
          background: rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 14px;
          
          .bell-icon {
            font-size: 26px;
            width: 26px;
            height: 26px;
            color: white;
          }

          .badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ef4444;
            color: white;
            font-size: 11px;
            font-weight: 700;
            min-width: 20px;
            height: 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #3D5A80;
          }
        }

        .header-text {
          h2 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }

          p {
            margin: 6px 0 0;
            font-size: 14px;
            opacity: 0.8;
            font-weight: 400;
          }
        }
      }

      .close-btn {
        color: white;
        background: rgba(255,255,255,0.1);
        border-radius: 6px;
        width: 36px;
        height: 36px;
        transition: background 0.2s;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }

        &:hover {
          background: rgba(255,255,255,0.2);
        }
      }
    }

    .popup-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 28px;
      background: #f9fafb;
      max-height: 400px;

      &::-webkit-scrollbar {
        width: 5px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }
    }

    .notification-card {
      display: flex;
      align-items: flex-start;
      background: white;
      border-radius: 8px;
      margin-bottom: 16px;
      padding: 20px;
      border: 1px solid #e5e7eb;
      animation: slideIn 0.3s ease-out forwards;
      opacity: 0;
      transform: translateY(-8px);
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);

      &:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        transform: translateY(-2px);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .card-indicator {
        display: none;
      }

      .card-icon {
        flex-shrink: 0;
        margin-right: 16px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          padding: 12px;
          border-radius: 8px;
        }

        .icon-success {
          background: #ecfdf5;
          color: #059669;
        }

        .icon-warning {
          background: #fffbeb;
          color: #d97706;
        }

        .icon-error {
          background: #fef2f2;
          color: #dc2626;
        }

        .icon-info {
          background: #eff6ff;
          color: #2563eb;
        }

        .icon-bill {
          background: #f0f4f8;
          color: #3D5A80;
        }

        .icon-payment {
          background: #ecfeff;
          color: #0891b2;
        }
      }

      .card-content {
        flex: 1;
        min-width: 0;

        .card-title {
          font-weight: 600;
          font-size: 15px;
          color: #111827;
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .card-message {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 2px;
        }

        .card-time {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 12px;
          font-size: 12px;
          color: #9ca3af;
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 12px;

          mat-icon {
            font-size: 13px;
            width: 13px;
            height: 13px;
          }
        }
      }
    }

    @keyframes slideIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .popup-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 28px 24px;
      background: white;
      border-top: 1px solid #e5e7eb;

      .mark-read-btn {
        color: #6b7280;
        font-weight: 500;
        font-size: 14px;
        padding: 10px 18px;
        border-radius: 6px;
        transition: all 0.2s;

        mat-icon {
          margin-right: 8px;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          color: #3D5A80;
          background: #f3f4f6;
        }
      }

      .view-all-btn {
        background: #A68B5B;
        border-radius: 6px;
        padding: 12px 28px;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.03em;
        box-shadow: 0 2px 8px rgba(166, 139, 91, 0.3);
        transition: all 0.2s;

        mat-icon {
          margin-left: 10px;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          background: #8b7355;
          box-shadow: 0 4px 12px rgba(166, 139, 91, 0.4);
        }
      }
    }
  `]
})
export class NotificationPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<NotificationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { notifications: Notification[] },
    private notificationsService: NotificationsService
  ) {}

  getIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'billgenerated':
        return 'receipt_long';
      case 'paymentreceived':
        return 'payments';
      case 'paymentdue':
        return 'warning_amber';
      case 'success':
      case 'connectionapproved':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'error':
      case 'connectionrejected':
        return 'cancel';
      default:
        return 'notifications';
    }
  }

  getIconClass(type: string): string {
    return 'icon-' + this.getTypeClass(type);
  }

  getTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'billgenerated':
        return 'bill';
      case 'paymentreceived':
        return 'payment';
      case 'paymentdue':
        return 'warning';
      case 'success':
      case 'connectionapproved':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'connectionrejected':
        return 'error';
      default:
        return 'info';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead().subscribe(() => {
      this.dialogRef.close('marked');
    });
  }

  viewAll(): void {
    this.dialogRef.close('viewAll');
  }

  close(): void {
    this.dialogRef.close();
  }
}
