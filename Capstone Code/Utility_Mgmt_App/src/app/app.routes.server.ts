import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static routes can be prerendered
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'unauthorized', renderMode: RenderMode.Prerender },
  
  // All other routes use client-side rendering (including dynamic routes with params)
  { path: '**', renderMode: RenderMode.Client }
];
