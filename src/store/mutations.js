import Vue from 'vue';

export default {
  SET_USER_INFO: (state, { type }) => { // 个人信息
    state.activeType = type;
  },

  SET_WORK_INFO: (state, { type, ids }) => { // 作品详情
    state.lists[type] = ids;
  },

  SET_MUSIXISER_INFO: (state, { items }) => { // 作者信息
    items.forEach((item) => {
      if (item) {
        Vue.set(state.items, item.id, item);
      }
    });
  },
  SET_BOUNCE_PROJECT: (state, { record }) => { // 储存录制信息
    state.recordProject = record;
  },
  SET_ID_PROJECT: (state, { record, info }) => { // 储存录制信息
    state.recordProject = record; // this is the music itself
    state.recordProjectInfo = info; // this includes all the relative info
  },
  SET_FINAL_WORK: (state, { type }) => { // 储存成品信息
    state.activeType = type;
  },
  SET_USER: (state, { id, user }) => {
    Vue.set(state.users, id, user || false); /* false means user not found */
  },
};
