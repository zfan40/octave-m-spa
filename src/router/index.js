import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import MBMaker from '@/components/MBMaker';

import MBAuthor from '@/components/MBAuthor';
import NMBMaker from '@/components/NMBMaker';
import MBViewer from '@/components/MBViewer';
import NMBViewer from '@/components/NMBViewer';

Vue.use(Router);

export default new Router({
  // mode: 'history', // avoid hash in url
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld,
    },
    {
      path: '/music-box-maker',
      name: 'MBMaker',
      component: MBMaker,
    },
    {
      path: '/new-music-box-maker',
      name: 'NMBMaker',
      component: NMBMaker,
    },
    {
      path: '/new-music-box-viewer',
      name: 'NMBViewer',
      component: NMBViewer,
    },
    {
      path: '/music-box-viewer',
      name: 'MBViewer',
      component: MBViewer,
    },
    {
      path: '/music-box-author',
      name: 'MBAuthor',
      component: MBAuthor,
    },
  ],
});
