// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import VueTouch from 'vue-touch';
import { createStore } from './store';
import App from './App';
import router from './router';

Vue.use(VueTouch, { name: 'v-touch' });
Vue.config.productionTip = false;
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
