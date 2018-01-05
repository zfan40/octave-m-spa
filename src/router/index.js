import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import MBMaker from '@/components/MBMaker';
import MBItem from '@/components/MBItem';
import MBAuthor from '@/components/MBAuthor';
import NMBMaker from '@/components/NMBMaker';
import MBViewer from '@/components/MBViewer';

Vue.use(Router);

export default new Router({
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
      path: '/music-box-viewer',
      name: 'MBViewer',
      component: MBViewer,
    },
    {
      path: '/music-box-item',
      name: 'MBItem',
      component: MBItem,
    },
    {
      path: '/music-box-author',
      name: 'MBAuthor',
      component: MBAuthor,
    },
  ],
});
