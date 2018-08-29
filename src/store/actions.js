import {
  // fetchUser,
  // fetchItems,
  // fetchIdsByType,
  fetchMbox,
  uploadRecord,
  fetchMusixiser,
  fetchWorksFromMusixiser,
  fetchFavWorks,
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

  FETCH_MBOX: ({ commit, state }, { id }) =>
    new Promise((resolve, reject) => {
      // 获取某id的音乐盒音乐内容
      fetchMbox(id).then((project) => {
        console.log('xxi', project.data.data.url);
        console.log('xxi', project.data.data.userId);
        fetchMusixiser(project.data.data.userId).then((musixiser) => {
          console.log('work musixiser info: ', musixiser.data.data);
          project.data.data.userVO = musixiser.data.data; // 拼接口。
          const request = new XMLHttpRequest();
          request.open('GET', project.data.data.url, true);
          request.send(null);
          request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
              const type = request.getResponseHeader('Content-Type');
              if (type.indexOf('text') !== -1) {
                commit('SET_ID_PROJECT', {
                  record: JSON.parse(request.responseText),
                  info: project.data.data,
                });
                resolve();
              }
            }
          };
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
