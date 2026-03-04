import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/board' },
  { path: '/board', name: 'Board', component: () => import('./views/BoardView.vue') },
  { path: '/calendar', name: 'Calendar', component: () => import('./views/CalendarView.vue') },
  { path: '/consent', name: 'Consent', component: () => import('./views/ConsentView.vue') },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
