import { Component, ViewChild, OnInit, OnDestroy, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { User, Notification } from '../../core/models';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationPopupComponent } from './notification-popup/notification-popup.component';

interface NavItem {
  label: string;
  link: string;
  icon: string;
  roles?: string[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, MatTooltipModule, MatBadgeModule, MatDialogModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer?: MatSidenav;

  currentUser$: Observable<User | null>;
  isBrowser: boolean;
  unreadCount = 0;
  private subscriptions: Subscription[] = [];

  // Reorganized navigation with sections for a different look
  navSections: NavSection[] = [
    {
      title: '',
      items: [
        { label: 'Dashboard', link: '/dashboard', icon: 'space_dashboard' }
      ]
    },
    {
      title: 'Consumer Management',
      items: [
        { label: 'Consumers', link: '/consumers', icon: 'group', roles: ['Admin'] },
        { label: 'Connections', link: '/connections', icon: 'cable', roles: ['Admin', 'BillingOfficer'] },
        { label: 'Request Utility', link: '/connection-requests/request', icon: 'add_task', roles: ['Consumer'] },
        { label: 'Pending Requests', link: '/connection-requests/manage', icon: 'pending', roles: ['Admin'] }
      ]
    },
    {
      title: 'Billing & Payments',
      items: [
        { label: 'Meter Readings', link: '/meter-readings', icon: 'speed', roles: ['BillingOfficer'] },
        { label: 'Bills', link: '/billing', icon: 'receipt_long', roles: ['BillingOfficer', 'Consumer'] },
        { label: 'Payments', link: '/payments', icon: 'payments', roles: ['AccountOfficer', 'Consumer'] }
      ]
    },
    {
      title: 'Reports & Analytics',
      items: [
        { label: 'Reports', link: '/reports', icon: 'analytics', roles: ['AccountOfficer', 'Consumer'] }
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'Billing Cycles', link: '/admin/billing-cycles', icon: 'schedule', roles: ['Admin'] },
        { label: 'Utility Types', link: '/admin/utility-types', icon: 'category', roles: ['Admin'] },
        { label: 'Tariff Plans', link: '/admin/tariff-plans', icon: 'sell', roles: ['Admin'] },
        { label: 'Users', link: '/admin/users', icon: 'admin_panel_settings', roles: ['Admin'] }
      ]
    },
    {
      title: 'My Portal',
      items: [
        { label: 'My Account', link: '/my-account', icon: 'badge', roles: ['Consumer'] }
      ]
    }
  ];

  // Keep legacy navItems for compatibility
  navItems = [
    { label: 'Dashboard', link: '/dashboard', icon: 'dashboard' },
    { label: 'Consumers', link: '/consumers', icon: 'people', roles: ['Admin'] },
    { label: 'Connections', link: '/connections', icon: 'electrical_services', roles: ['Admin', 'BillingOfficer'] },
    { label: 'Request Utility', link: '/connection-requests/request', icon: 'add_circle', roles: ['Consumer'] },
    { label: 'Connection Requests', link: '/connection-requests/manage', icon: 'pending_actions', roles: ['Admin'] },
    { label: 'Meter Readings', link: '/meter-readings', icon: 'speed', roles: ['BillingOfficer'] },
    { label: 'Bills', link: '/billing', icon: 'receipt', roles: ['BillingOfficer', 'Consumer'] },
    { label: 'Payments', link: '/payments', icon: 'payment', roles: ['AccountOfficer', 'Consumer'] },
    { label: 'Reports', link: '/reports', icon: 'assessment', roles: ['AccountOfficer', 'Consumer'] },
    { label: 'Billing Cycles', link: '/admin/billing-cycles', icon: 'event_repeat', roles: ['Admin'] },
    { label: 'Utility Types', link: '/admin/utility-types', icon: 'category', roles: ['Admin'] },
    { label: 'Tariff Plans', link: '/admin/tariff-plans', icon: 'price_change', roles: ['Admin'] },
    { label: 'User Management', link: '/admin/users', icon: 'manage_accounts', roles: ['Admin'] },
    { label: 'My Account', link: '/my-account', icon: 'account_circle', roles: ['Consumer'] }
  ];

  constructor(
    private authService: AuthService,
    private notificationsService: NotificationsService,
    private router: Router,
    private ngZone: NgZone,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Reload user from storage on client-side after SSR hydration
    if (this.isBrowser) {
      this.authService.reloadUser();
      
      // Subscribe to unread count
      this.subscriptions.push(
        this.notificationsService.unreadCount$.subscribe(count => {
          this.unreadCount = count;
        })
      );

      // Load unread notifications and show popup if any
      this.loadAndShowNotifications();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadAndShowNotifications(): void {
    this.notificationsService.getUnreadNotifications().subscribe(response => {
      if (response.success && response.data && response.data.length > 0) {
        // Show popup with unread notifications
        this.showNotificationPopup(response.data);
      }
    });
  }

  private showNotificationPopup(notifications: Notification[]): void {
    const dialogRef = this.dialog.open(NotificationPopupComponent, {
      width: '460px',
      maxHeight: '85vh',
      data: { notifications },
      panelClass: 'notification-popup-dialog',
      backdropClass: 'notification-popup-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'viewAll') {
        this.router.navigate(['/notifications']);
      }
    });
  }

  navigate(link: string): void {
    // Force navigation using NgZone to ensure change detection
    this.ngZone.run(() => {
      this.router.navigateByUrl(link);
    });
  }

  toggleSidenav(): void {
    this.drawer?.toggle();
  }

  canView(itemRoles?: string[]): boolean {
    if (!itemRoles || itemRoles.length === 0) {
      return true;
    }
    return this.authService.hasRole(itemRoles);
  }

  hasVisibleItems(items: NavItem[]): boolean {
    return items.some(item => this.canView(item.roles));
  }

  getSectionTitle(title: string): string {
    if (title === 'Billing & Payments' && this.authService.hasRole(['AccountOfficer']) && !this.authService.hasRole(['BillingOfficer', 'Consumer'])) {
      return 'Payments';
    }
    return title;
  }

  logout(): void {
    this.authService.logout();
  }
}
