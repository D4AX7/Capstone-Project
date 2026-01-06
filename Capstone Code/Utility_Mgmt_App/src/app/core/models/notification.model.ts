// Notification DTOs

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
}

export interface NotificationSummary {
  totalNotifications: number;
  unreadCount: number;
  recentNotifications: Notification[];
}

export type NotificationType = 'Info' | 'Warning' | 'Error' | 'Success' | 'BillGenerated' | 'PaymentReceived' | 'PaymentDue';
