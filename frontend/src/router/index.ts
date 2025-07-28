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
    
    if (to.path === '/login' && isLoggedIn) {
      return '/';
    }
  });

  return Router;
});
