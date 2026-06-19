import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';

export const routes: Routes = [
  { path: '', component: EditorComponent },
  { path: 'zklogin-callback', loadComponent: () => import('./auth/zklogin-callback.component').then(m => m.ZkLoginCallbackComponent) },
  { path: 'agent-callback', loadComponent: () => import('./auth/agent-callback.component').then(m => m.AgentCallbackComponent) },
];
