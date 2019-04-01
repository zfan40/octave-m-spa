import {
  // fetchUser,
  // fetchItems,
  // fetchIdsByType,
  fetchMbox,
  uploadRecord,
  fetchMusixiser,
  fetchWorksFromMusixiser,
  fetchFavWorks,
  fetchProductList,
  fetchOrders,
  fetchStacks,
  fetchSquareWorks
} from '../_common/js/api';
/*
  getUserInfo
  getWorkInfo
  getMusixiserInfo
  saveWork
*/
export default {
  BOUNCE_PROJECT: ({ commit, state }, { record, info }) => uploadRecord(record, info),
  // 存作品到后台
  // uploadRecord(record, info).then(() => {
  //   // commit('SET_BOUNCE_PROJECT', { record, info });
  //   // 可以在组建直接跳链接，不commit 存store一道
  // });

  FETCH_MBOX: async ({ commit, state }, { id }) =>
    // {
    //   const project = await fetchMbox(id);
    //   console.log('xxi', project.data.data.url);
    //   console.log('xxi', project.data.data.userId);
    //   const musixiser = await fetchMusixiser(project.data.data.userId);
    //   console.log('work musixiser info: ', musixiser.data.data);
    //   project.data.data.userVO = musixiser.data.data; // 拼接口。
    //   // MidiConvert.load(project.data.data.url, (midi) => {
    //   MidiConvert.load('//cdn.cnbj1.fds.api.mi-img.com/lftemp/silent_night_easy.mid', (midi) => {
    //     commit('SET_ID_PROJECT', {
    //       record: midi.tracks[0].notes,
    //       info: project.data.data,
    //     });
    //   });
    // },
    new Promise((resolve, reject) => {
      // 获取某id的音乐盒音乐内容
      fetchMbox(id).then((project) => {
        console.log('xxi', project.data.data.url);
        console.log('xxi', project.data.data.userId);
        fetchMusixiser(project.data.data.userId).then((musixiser) => {
          console.log('work musixiser info: ', musixiser.data.data);
          project.data.data.userVO = musixiser.data.data; // 拼接口。
          // load music notes/ midi notes
          // '//cdn.cnbj1.fds.api.mi-img.com/lftemp/silent_night_easy.mid' => test url

          MidiConvert.load(project.data.data.url, (midi) => {
            console.log('midi', midi);
            const mergeNotes = midi.tracks.reduce((a, b) => a.concat(b.notes), []);
            commit('SET_ID_PROJECT', {
              record: mergeNotes, // midi.tracks[1].notes, // TODO:稍后要改成0
              info: project.data.data,
            });
            resolve();
          });
          // const request = new XMLHttpRequest();
          // request.open('GET', project.data.data.url, true);
          // request.send(null);
          // request.onreadystatechange = function () {
          //   if (request.readyState === 4 && request.status === 200) {
          //     const type = request.getResponseHeader('Content-Type');
          //     if (type.indexOf('text') !== -1) {
          //       commit('SET_ID_PROJECT', {
          //         record: JSON.parse(request.responseText),
          //         info: project.data.data,
          //       });
          //       resolve();
          //     }
          //   }
          // };
        });
      });
    }),
  FETCH_MUSIXISER: ({ commit, state }, { id }) =>
    new Promise((resolve, reject) => {
      // 获取某id的音乐盒音乐内容
      fetchMusixiser(id).then((musixiser) => {
        console.log('musixiser info: ', musixiser.data.data);
        commit('SET_MUSIXISER', { musixiserInfo: musixiser.data.data });
        resolve();
      });
    }),
  FETCH_SQUARE_WORKS: ({ commit, state }, { page, size }) =>
    new Promise((resolve, reject) => {
      // 获取某id的音乐盒音乐内容
      fetchSquareWorks({ page, size }).then((works) => {
        console.log('works list: ', works.data.data);
        commit('PUSH_SQUARE_WORKS', { squareWorksObj: works.data.data });
        resolve();
      });
    }),
  FETCH_WORKS_FROM_MUSIXISER: ({ commit, state }, { id, page }) =>
    new Promise((resolve, reject) => {
      // 获取某id的音乐盒音乐内容
      fetchWorksFromMusixiser(id, page).then((works) => {
        console.log('works list: ', works.data.data);
        commit('PUSH_MUSIXISER_WORKS', { musixiserWorksObj: works.data.data });
        resolve();
      });
    }),
  FETCH_FAV_WORKS: ({ commit, state }, { id, page }) =>
    new Promise((resolve, reject) => {
      // 获取某id的音乐盒音乐内容
      fetchFavWorks(id, page).then((works) => {
        console.log('works list: ', works.data.data);
        commit('PUSH_FAV_WORKS', { favWorksObj: works.data.data });
        resolve();
      });
    }),
  FETCH_PRODUCTLIST: ({ commit, state }, { id, page }) =>
    new Promise((resolve, reject) => {
      // 获取某id的音乐盒音乐内容
      fetchProductList().then((products) => {
        console.log('product list: ', products.data.data.list);
        commit('PUSH_PRODUCTLIST', { productList: products.data.data.list });
        resolve();
      });
    }),
  FETCH_ORDERS: ({ commit, state }, { page }) =>
    new Promise((resolve, reject) => {
      // 获取某id的音乐盒音乐内容
      fetchOrders(page).then((orders) => {
        // console.log('product list: ', orders.data.data.list);
        commit('PUSH_ORDERS', { orders: orders.data.data });
        resolve();
      });
    }),
  FETCH_STACKS: ({ commit, state }, { page, size }) =>
    new Promise((resolve, reject) => {
      fetchStacks({ page, size }).then((stacks) => {
        commit('PUSH_STACKS', { stacks: stacks.data.list });
        resolve();
      })
    })
  //   // ensure data for rendering given list type
  //   FETCH_LIST_DATA: ({ commit, dispatch, state }, { type }) => {
  //     commit('SET_ACTIVE_TYPE', { type });
  //     return fetchIdsByType(type)
  //       .then(ids => commit('SET_LIST', { type, ids }))
  //       .then(() => dispatch('ENSURE_ACTIVE_ITEMS'));
  //   },
  //
  //   // ensure all active items are fetched
  //   ENSURE_ACTIVE_ITEMS: ({ dispatch, getters }) => dispatch('FETCH_ITEMS', {
  //     ids: getters.activeIds,
  //   }),
  //
  //   FETCH_ITEMS: ({ commit, state }, { ids }) => {
  //     // on the client, the store itself serves as a cache.
  //     // only fetch items that we do not already have, or has expired (3 minutes)
  //     const now = Date.now();
  //     ids = ids.filter((id) => {
  //       const item = state.items[id];
  //       if (!item) {
  //         return true;
  //       }
  //       if (now - item.__lastUpdated > 1000 * 60 * 3) {
  //         return true;
  //       }
  //       return false;
  //     });
  //     if (ids.length) {
  //       return fetchItems(ids).then(items => commit('SET_ITEMS', { items }));
  //     }
  //     return Promise.resolve();
  //   },
  //
  //   FETCH_USER: ({ commit, state }, { id }) => (state.users[id]
  //       ? Promise.resolve(state.users[id])
  //       : fetchUser(id).then(user => commit('SET_USER', { id, user }))),
};
