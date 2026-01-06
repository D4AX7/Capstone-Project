import { Routes } from '@angular/router';
import { UnauthorizedComponent } from './core/components/unauthorized.component';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
	{ path: '', redirectTo: '/dashboard', pathMatch: 'full' },

	{
		path: '',
		component: AuthLayoutComponent,
		children: [
			{
				path: 'login',
				loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
			},
			{
				path: 'register',
				loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
			}
		]
	},

	{
		path: '',
		component: MainLayoutComponent,
		children: [
			{
				path: 'dashboard',
				loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
				canActivate: [AuthGuard]
			},
			{
				path: 'consumers',
				loadChildren: () => import('./features/consumers/consumers.module').then((m) => m.ConsumersModule),
				canActivate: [AuthGuard],
				data: { roles: ['Admin', 'BillingOfficer', 'AccountOfficer'] }
			},
			{
				path: 'connections',
				loadChildren: () => import('./features/connections/connections.module').then((m) => m.ConnectionsModule),
				canActivate: [AuthGuard],
				data: { roles: ['Admin', 'BillingOfficer', 'AccountOfficer'] }
			},
			{
				path: 'connection-requests',
				loadChildren: () => import('./features/connection-requests/connection-requests.module').then((m) => m.ConnectionRequestsModule),
				canActivate: [AuthGuard],
				data: { roles: ['Admin', 'Consumer'] }
			},
			{
				path: 'meter-readings',
				loadChildren: () => import('./features/meter-readings/meter-readings.module').then((m) => m.MeterReadingsModule),
				canActivate: [AuthGuard],
				data: { roles: ['BillingOfficer'] }
			},
			{
				path: 'billing',
				loadChildren: () => import('./features/billing/billing.module').then((m) => m.BillingModule),
				canActivate: [AuthGuard],
				data: { roles: ['BillingOfficer', 'AccountOfficer', 'Consumer'] }
			},
			{
				path: 'payments',
				loadChildren: () => import('./features/payments/payments.module').then((m) => m.PaymentsModule),
				canActivate: [AuthGuard],
				data: { roles: ['AccountOfficer', 'Consumer'] }
			},
			{
				path: 'reports',
				loadChildren: () => import('./features/reports/reports.module').then((m) => m.ReportsModule),
				canActivate: [AuthGuard],
				data: { roles: ['BillingOfficer', 'AccountOfficer', 'Consumer'] }
			},
			{
				path: 'notifications',
				loadChildren: () => import('./features/notifications/notifications.module').then((m) => m.NotificationsModule),
				canActivate: [AuthGuard]
			},
			{
				path: 'admin',
				loadChildren: () => import('./features/admin/admin.module').then((m) => m.AdminModule),
				canActivate: [AuthGuard],
				data: { roles: ['Admin'] }
			},
			{
				path: 'my-account',
				loadChildren: () => import('./features/consumer-portal/consumer-portal.module').then((m) => m.ConsumerPortalModule),
				canActivate: [AuthGuard],
				data: { roles: ['Consumer'] }
			}
		]
	},

	{ path: 'unauthorized', component: UnauthorizedComponent },
	{ path: '**', redirectTo: '/dashboard' }
];
