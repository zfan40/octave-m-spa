// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import { sync } from 'vuex-router-sync';
// import VueTouch from 'vue-touch';
import 'vue2-toast/lib/toast.css';
import Toast from 'vue2-toast';
// import infiniteScroll from 'vue-infinite-scroll'
import { createStore } from './store';
import App from './App';
import router from './router';
import { getDateDiff } from './_common/js/filters';
import { longpress } from './_common/js/directives';
import VueAnalytics from 'vue-analytics'

import * as Sentry from '@sentry/browser';
import * as Integrations from '@sentry/integrations';

Sentry.init({
  dsn: 'https://86039b25a68a419b85c64bd61c77f4e7@sentry.io/1455098',
  integrations: [
    new Integrations.Vue({
      Vue,
      attachProps: true,
    }),
  ],
});

// Vue.use(VueTouch, { name: 'v-touch' });
Vue.use(VueAnalytics, {
  id: 'UA-138246971-1',
  router
})
Vue.use(Toast, { defaultType: 'center', duration: 2500, wordWrap: false, width: 'auto' });
// Vue.use(infiniteScroll)
Vue.config.productionTip = false;
Vue.filter('getDateDiff', getDateDiff)
Vue.directive('longpress', longpress)

const store = createStore();
sync(store, router);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App },
});
