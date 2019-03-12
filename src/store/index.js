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
      recordProjectInfo: {},
      musixiserInfo: {},
      musixiserWorksObj: { content: [] },
      favWorksObj: { content: [] },
      targetProduct: {},
      targetWork: {},
      productList: [
        // {
        //   "id": 5,
        //   "category": 0,
        //   "name": "111",
        //   "intro": "ssssss",
        //   "price": 0.01,
        //   "status": 0,
        //   "createdDate": 1545545063000,
        //   "previewPic": 'http://img1.imgtn.bdimg.com/it/u=1428864537,4075266830&fm=26&gp=0.jpg'
        // },
        // {
        //   "id": 3,
        //   "category": 0,
        //   "name": "产品名02",
        //   "intro": "八音盒02",
        //   "price": 0.02,
        //   "status": 0,
        //   "createdDate": 1545545057000,
        //   "previewPic": 'http://img5.imgtn.bdimg.com/it/u=2832745675,3618470846&fm=26&gp=0.jpg'
        // },
        // {
        //   "id": 2,
        //   "category": 0,
        //   "name": "产品名03",
        //   "intro": "八音盒01",
        //   "price": 0.02,
        //   "status": 0,
        //   "createdDate": 1545545054000,
        //   "previewPic": 'http://img3.imgtn.bdimg.com/it/u=567439238,127662271&fm=26&gp=0.jpg'
        // },
        // {
        //   "id": 1,
        //   "category": 0,
        //   "name": "产品名04",
        //   "intro": "八音盒",
        //   "price": 0.01,
        //   "status": 0,
        //   "createdDate": 1545545048000,
        //   "previewPic": 'http://img5.imgtn.bdimg.com/it/u=771337150,1492914445&fm=26&gp=0.jpg'
        // }
      ], // ProductList.vue
      orderToCreate: {
        // OrderConfirm.vue & createOrder
        wid: '',
        pid: '',
        address: {},
      },
      operatingWorkId: -1,
      playingWorkId: -1,
    },
    actions,
    mutations,
    getters,
  });
}
