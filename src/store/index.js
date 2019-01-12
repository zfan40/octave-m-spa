import Vue from 'vue';
import Vuex from 'vuex';
import actions from './actions';
import mutations from './mutations';
import getters from './getters';

Vue.use(Vuex);

export function createStore() {
  return new Vuex.Store({
    state: {
      activeType: null,
      itemsPerPage: 20,
      items: {
        /* [id: number]: Item */
      },
      users: {
        /* [id: string]: User */
      },
      lists: {
        top: [
          /* number */
        ],
        new: [],
        show: [],
        ask: [],
        job: [],
      },
      myInfo: {},
      recordParts: [],
      recordProject: [],
      musixiserInfo: {},
      musixiserWorksObj: { content: [] },
      favWorksObj: { content: [] },
      productList: [], // ProductList.vue
      orderToCreate: {
        // OrderConfirm.vue & createOrder
        wid: '',
        pid: '',
        address: '',
      },
    },
    actions,
    mutations,
    getters,
  });
}
