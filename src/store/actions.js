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
      fetchSquareWorks({ page, size }).then((works) => {
        console.log('works list: ', works.data.data);
        commit('PUSH_SQUARE_WORKS', { squareWorksObj: works.data.data });
        resolve();
      });
    }),
  FETCH_BOARD_WORKS: ({ commit, state }, { page, size, category, orderStrategy }) =>
    new Promise((resolve, reject) => {
      fetchSquareWorks({ page, size, category, orderStrategy }).then((works) => {
        console.log('works list: ', works.data.data);

        // 前端特殊处理一下， 规则是前三不能重，且能做成八音盒
        /****** page == 1 的情况 ***/
        if (page == 1) {
          const winnerList = []
          const winnerIdList = []
          let count = 0
          while (winnerList.length < 3 && count < works.data.data.list.length) {
            if (!winnerIdList.includes(works.data.data.list[count].userId) && works.data.data.list[count].machineNum && works.data.data.list[count].machineNum <= 18) { //获奖者不能重
              console.log(works.data.data.list[count].userId)
              winnerIdList.push(works.data.data.list[count].userId)
              winnerList.push(works.data.data.list.splice(count, 1)[0])
              count -= 1
            }
            count += 1
          }
          while (winnerList.length < 3) {
            // 补成长度为3
            // winnerList.push({ "id": 250, "title": "xxx", "cover": "//img.musixise.com/LV39yVJ4_h32Ti71ZPpfzOKa6APTv4myG0QiIL_oONE791TTq7Pg6SMoKMKyYnYT_95ctDRho.jpg", "content": "#母亲节 观后感火锅", "url": "//audio.musixise.com/cT45Sf8H_output.mid", "favStatus": 0, "createdDate": "2019-04-27 15:25:46", "userId": 259, "collectNum": 2, "lastModifiedDate": "2019-04-27 15:27:13", "fileHash": "aa1c4c6b3b59799ea9a40cc5d4165dcd", "userVO": { "id": 128, "username": null, "realname": "Ziyu", "tel": "", "email": "wechat_oazyg5_wyrjKDS-I9s_PT173Q6w8@musixise.com", "birth": "2000-01-01", "gender": "", "smallAvatar": "//thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTIPfibuvpgFicz4TqibGrAZ1ZiacJTnicVNbTmJw4ibc9XoYadV5wkGLJ5GFtAiaaZwA0MT06bI1HbdzHfDQ/132", "largeAvatar": "//thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTIPfibuvpgFicz4TqibGrAZ1ZiacJTnicVNbTmJw4ibc9XoYadV5wkGLJ5GFtAiaaZwA0MT06bI1HbdzHfDQ/132", "nation": "", "isMaster": 0, "brief": null, "followStatus": 0, "followNum": 0, "fansNum": 0, "songNum": 1, "userId": 259, "createdDate": "2019-04-27 15:25:46" }, "machineNum": 17, "pv": 0, "status": 0, "category": 1 })
            winnerList.push({})
          }
          console.log('--------')
          console.log(winnerList)
          works.data.data.list = winnerList.concat(works.data.data.list)

          console.log(works.data.data.list)
        }

        /****** */
        commit('PUSH_BOARD_WORKS', { boardWorksObj: works.data.data });
        resolve();
      });
    }),
  FETCH_WORKS_FROM_MUSIXISER: ({ commit, state }, { id, page }) =>
    new Promise((resolve, reject) => {
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
        commit('PUSH_PRODUCTLIST', { productList: products.data.data.list.filter(item => item.category == 1) });
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
