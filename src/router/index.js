import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import Square from '@/components/Square';
// import MBMaker from '@/components/MBMaker';

// import MBAuthor from '@/components/MBAuthor';
import NMBMaker from '@/components/NMBMaker';
// import MBViewer from '@/components/MBViewer';
import NMBViewer from '@/components/NMBViewer';
import MBRoll from '@/components/MBRollMaker';
import MusixiserDetail from '@/components/MusixiserDetail';
import MyFav from '@/components/MyFav';
import Recommend from '@/components/Recommend';
import ProductList from '@/components/ProductList';
import OrderConfirm from '@/components/OrderConfirm';
import MyOrders from '@/components/MyOrders';

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
      path: '/square',
      name: 'Square',
      component: Square,
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
      path: '/product-list',
      name: 'productList',
      component: ProductList,
    },
    {
      path: '/order-confirm',
      name: 'OrderConfirm',
      component: OrderConfirm,
    },
    {
      path: '/musixiser',
      name: 'MusixiserDetail',
      component: MusixiserDetail,
    },
    {
      path: '/my-fav',
      name: 'MyFav',
      component: MyFav,
    },

    {
      path: '/recommend',
      name: 'Recommend',
      component: Recommend,
    },
    {
      path: '/my-orders',
      name: 'MyOrders',
      component: MyOrders,
    }
  ],
});
