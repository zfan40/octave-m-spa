import {
  fetchUser,
  fetchItems,
  fetchIdsByType,
  fetchMbox,
  uploadRecord,
} from '../_common/js/api';
/*
  getUserInfo
  getWorkInfo
  getMusixiserInfo
  saveWork
*/
export default {
  BOUNCE_PROJECT: ({ commit, state }, { record, info }) =>
    // 存作品到后台
     uploadRecord(record, info),
         // uploadRecord(record, info).then(() => {
    //   // commit('SET_BOUNCE_PROJECT', { record, info });
    //   // 可以在组建直接跳链接，不commit 存store一道
    // });

  FETCH_MBOX: ({ commit, state }, { id }) =>
    // 获取某id的音乐盒音乐内容
     fetchMbox(id)
      .then((project) => {
        // console.log('xxi', project.data.data.url);
        const request = new XMLHttpRequest();
        request.open('GET', project.data.data.url, true);
        request.send(null);
        request.onreadystatechange = function () {
          if (request.readyState === 4 && request.status === 200) {
            const type = request.getResponseHeader('Content-Type');
            if (type.indexOf('text') !== 1) {
              commit('SET_ID_PROJECT', { record: JSON.parse(request.responseText), info: project.data.data });
            }
          }
        };
      }),
  // ensure data for rendering given list type
  FETCH_LIST_DATA: ({ commit, dispatch, state }, { type }) => {
    commit('SET_ACTIVE_TYPE', { type });
    return fetchIdsByType(type)
      .then(ids => commit('SET_LIST', { type, ids }))
      .then(() => dispatch('ENSURE_ACTIVE_ITEMS'));
  },

  // ensure all active items are fetched
  ENSURE_ACTIVE_ITEMS: ({ dispatch, getters }) => dispatch('FETCH_ITEMS', {
    ids: getters.activeIds,
  }),

  FETCH_ITEMS: ({ commit, state }, { ids }) => {
    // on the client, the store itself serves as a cache.
    // only fetch items that we do not already have, or has expired (3 minutes)
    const now = Date.now();
    ids = ids.filter((id) => {
      const item = state.items[id];
      if (!item) {
        return true;
      }
      if (now - item.__lastUpdated > 1000 * 60 * 3) {
        return true;
      }
      return false;
    });
    if (ids.length) {
      return fetchItems(ids).then(items => commit('SET_ITEMS', { items }));
    }
    return Promise.resolve();
  },

  FETCH_USER: ({ commit, state }, { id }) => (state.users[id]
      ? Promise.resolve(state.users[id])
      : fetchUser(id).then(user => commit('SET_USER', { id, user }))),
};
