import Vue from 'vue';

export default {
  SET_USER_INFO: (state, { type }) => {
    // 个人信息
    state.activeType = type;
  },

  SET_WORK_INFO: (state, { type, ids }) => {
    // 作品详情
    state.lists[type] = ids;
  },

  SET_MUSIXISER_INFO: (state, { items }) => {
    // 作者信息
    items.forEach((item) => {
      if (item) {
        Vue.set(state.items, item.id, item);
      }
    });
  },
  SET_BOUNCE_PROJECT: (state, { record }) => {
    // 储存录制信息
    state.recordProject = record;
  },
  SET_ID_PROJECT: (state, { record, info }) => {
    // 储存录制信息
    state.recordProject = record; // this is the music itself
    state.recordProjectInfo = info; // this includes all the relative info
  },
  SET_MUSIXISER: (state, { musixiserInfo }) => {
    // 储存录制信息
    state.musixiserInfo = musixiserInfo;
  },
  PUSH_MUSIXISER_WORKS: (state, { musixiserWorksObj }) => {
    // 储存录制信息
    console.log('ccccc', musixiserWorksObj.current);
    if (+musixiserWorksObj.current === 1) {
      state.musixiserWorksObj.content = musixiserWorksObj.list;
    } else {
      state.musixiserWorksObj.content = state.musixiserWorksObj.content.concat(
        musixiserWorksObj.list,
      );
    }
    state.musixiserWorksObj.total = musixiserWorksObj.total;
    state.musixiserWorksObj.size = musixiserWorksObj.size;
    state.musixiserWorksObj.current = musixiserWorksObj.current;
  },
  PUSH_FAV_WORKS: (state, { favWorksObj }) => {
    // 储存录制信息
    console.log('xxxxxxx', favWorksObj);
    if (+favWorksObj.current === 1) {
      state.favWorksObj.content = favWorksObj.list;
    } else {
      state.favWorksObj.content = state.favWorksObj.content.concat(favWorksObj.list);
    }
    state.favWorksObj.total = favWorksObj.total;
    state.favWorksObj.size = favWorksObj.size;
    state.favWorksObj.current = favWorksObj.current;
  },
  // SET_FINAL_WORK: (state, { type }) => { // 储存成品信息
  //   state.activeType = type;
  // },
  // SET_USER: (state, { id, user }) => {
  //   Vue.set(state.users, id, user || false); /* false means user not found */
  // },
  SAVE_ORDER_INFO: (state, { work, product, address }) => {
    state.orderToCreate.wid = work ? work.id : state.orderToCreate.wid;
    state.orderToCreate.pid = product ? product.id : state.orderToCreate.pid;
    state.orderToCreate.address = address || state.orderToCreate.address;
    state.targetProduct = product || state.targetProduct
    state.targetWork = work || state.targetWork
  },
  PUSH_PRODUCTLIST: (state, { productList }) => {
    state.productList = productList
    state.targetProduct = productList[0]
  },
  PUSH_ORDERS: (state, { orders }) => {
    // 储存录制信息
    console.log('xxxxxxx', orders);
    if (+orders.current === 1) {
      state.orders.content = orders.list;
    } else {
      state.orders.content = state.orders.content.concat(orders.list);
    }
    state.orders.total = orders.total;
    state.orders.size = orders.size;
    state.orders.current = orders.current;
  },
  OPERATE_WORK: (state, { work }) => {
    state.operatingWorkId = work.id
  },
  PLAY_WORK: (state, { work }) => {
    state.playingWorkId = work.id
  },
  LOCAL_UPDATE_LIST_FAV: (state, { type, item }) => {
    console.log(item)
    state[type].content.forEach((work) => {
      if (work.id == item.id) {
        work.favStatus = item.favStatus
        work.collectNum = work.favStatus ? work.collectNum + 1 : work.collectNum - 1
      }
    })
  },
  LOCAL_UPDATE_ORDER_STATUS: (state, { orderId, status }) => {
    state.orders.content.forEach((order) => {
      if (order.orderId == orderId) {
        order.status = status
      }
    })
  }
};
