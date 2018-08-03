import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
// import MBMaker from '@/components/MBMaker';

// import MBAuthor from '@/components/MBAuthor';
import NMBMaker from '@/components/NMBMaker';
// import MBViewer from '@/components/MBViewer';
import NMBViewer from '@/components/NMBViewer';
import MBRoll from '@/components/MBRollMaker';
import MusixiserDetail from '@/components/MusixiserDetail';
import MyFav from '@/components/MyFav';
import Recommend from '@/components/Recommend';

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
      path: '/new-music-box-maker',
      name: 'NMBMaker',
      component: NMBMaker,
    },
    {
      path: '/new-music-box-roll',
      name: 'MBRoll',
      component: MBRoll,
    },
    {
      path: '/new-music-box-viewer',
      name: 'NMBViewer',
      component: NMBViewer,
    },
    {
      path: '/musixiser',
      name: 'MusixiserDetail',
      component: MusixiserDetail,
    },
    {
      path: '/myfav',
      name: 'MyFav',
      component: MyFav,
    },
    {
      path: '/recommend',
      name: 'Recommend',
      component: Recommend,
    },
  ],
});
