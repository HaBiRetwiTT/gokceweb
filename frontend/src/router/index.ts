import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';

/*
 * When adding new routes to this file, they should be added to the routes array.
 * You can then edit this file to configure the router behavior.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Authentication guard
  Router.beforeEach((to) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (to.meta.requiresAuth && !isLoggedIn) {
      return '/login';
    }
    
    // Yetkisiz kullanıcıların kısıtlı sayfalara erişimini engelle
    if (isLoggedIn) {
      const username = localStorage.getItem('username') || '';
      const isAuthorizedUser = ['SAadmin', 'KADİR', 'HARUN'].includes(username);
      
      // Dashboard sadece yetkili kullanıcılar
      if (to.path === '/dashboard' && !isAuthorizedUser) {
        return '/kartli-islem';
      }
      
      // AI Agent sadece yetkili kullanıcılar
      if (to.path === '/ai-agent' && !isAuthorizedUser) {
        return '/kartli-islem';
      }
      
      // Nakit Tablo sadece SAadmin ve HARUN
      if (to.path === '/nakit-tablo' && !['SAadmin', 'HARUN'].includes(username)) {
        return '/kartli-islem';
      }
      
      // Personel İşlemleri sadece yetkili kullanıcılar
      if (to.path === '/personel-islem' && !isAuthorizedUser) {
        return '/kartli-islem';
      }
    }
    
    // Login sayfasından yönlendirme - kullanıcı yetkisine göre
    if (to.path === '/login' && isLoggedIn) {
      const username = localStorage.getItem('username') || '';
      // Dashboard'a erişimi olan kullanıcılar dashboard'a yönlendir
      if (['SAadmin', 'KADİR', 'HARUN'].includes(username)) {
        return '/dashboard';
      } else {
        // Diğer kullanıcılar kartli-islem sayfasına yönlendir
        return '/kartli-islem';
      }
    }
    
    // Root path yönlendirmesi - kullanıcı yetkisine göre
    if (to.path === '/' && isLoggedIn) {
      const username = localStorage.getItem('username') || '';
      // Dashboard'a erişimi olan kullanıcılar dashboard'a yönlendir
      if (['SAadmin', 'KADİR', 'HARUN'].includes(username)) {
        return '/dashboard';
      } else {
        // Diğer kullanıcılar kartli-islem sayfasına yönlendir
        return '/kartli-islem';
      }
    }
  });

  return Router;
});
