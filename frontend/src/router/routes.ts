import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('../pages/LoginPage.vue'),
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('../pages/DashboardPage.vue') },
      { path: '/dashboard', component: () => import('../pages/DashboardPage.vue') },
      { path: '/musteri-islem', component: () => import('../pages/musteri-islem.vue') },
      { path: '/kartli-islem', component: () => import('../pages/kartli-islem.vue') },
      { path: '/mevcut-rezerve', component: () => import('../pages/mevcut-rezerve.vue') },
      { path: '/gelir-gider', component: () => import('../pages/gelir-gider.vue') },
      { path: '/kasa-islem', component: () => import('../pages/kasa-islem.vue') }
      //{ path: '/odeme-islem', component: () => import('../pages/odeme-islem.vue') },
    ],
    meta: { requiresAuth: true }
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue'),
  },
];

export default routes;
