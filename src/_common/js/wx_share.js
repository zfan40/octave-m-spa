import axios from 'axios';
import wx from 'weixin-js-sdk';
import { createOrder, payOrder, sendAddress, getWXMedia } from './api';
import { fail } from 'assert';

const reqConfig = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};
export const prepareShareConfig = () =>
  new Promise((resolve, reject) => {
    axios
      .post(
        `//api.octave-love.com/api/v1/wechat/getTicket?url=${encodeURIComponent(
          window.location.href.split('#')[0],
        )}`,
        '',
        reqConfig,
      )
      .then(
        (res) => {
          // alert(`before # url: ${window.location.href.split('#')[0]}`);
          // alert(`full path: ${window.location.href}`);
          // alert(JSON.stringify(res.data.data));
          wx.config({
            debug: false,
            appId: res.data.data.appId,
            timestamp: res.data.data.timestamp,
            nonceStr: res.data.data.nonceStr,
            signature: res.data.data.signature,
            jsApiList: [
              'onMenuShareTimeline',
              'onMenuShareAppMessage',
              'chooseWXPay',
              'openAddress',
              'chooseImage',
              'uploadImage'
            ],
          });
          wx.ready(() => {
            // 配置wx.config成功
            resolve(wx);
          });
        },
        () => {
          reject('配置wx.config失败');
        },
      );
  });

// 分享配置
export const prepareShareContent = ({ title, desc, fullPath, imgUrl }) => {
  // const link = 'http://example.com/static/auth.html' +
  //              `?redirect_uri=${encodeURIComponent(window.location.href.split('#')[0])}` +
  //              `&full_path=${encodeURIComponent(fullPath)}`;
  const link = fullPath;
  wx.onMenuShareTimeline({
    title,
    link,
    imgUrl,
    success() { },
    cancel() { },
  });
  wx.onMenuShareAppMessage({
    title,
    desc,
    link,
    imgUrl,
    success() { },
    cancel() { },
  });
};

// order pay
export const makeWxOrder = async ({ pid, wid, amount, address, message }, successCallback, failCalback) => {
  // new Promise((resolve, reject) => {
  //address is
  //     {
  //   "userName": "string",
  //   "postalCode": "string",
  //   "provinceName": "string",
  //   "cityName": "string",
  //   "countryName": "string",
  //   "detailInfo": "string",
  //   "nationalCode": "string",
  //   "telNumber": "string"
  // }
  console.log('------------')
  const addressObj = await sendAddress(address)
  console.log('===========')
  console.log(addressObj)
  // return
  const res = await createOrder({ pid, wid, amount, addressId: addressObj.data.data, message })
  // 得到返回的支付参数
  // alert(JSON.stringify(res));
  const orderId = res.data.data;

  payWxOrder({ orderId }, successCallback, failCalback)

  // const payResult = await payOrder({ orderId })
  // // alert(JSON.stringify(res));
  // const params = payResult.data.data;
  // // alert(JSON.stringify(params));
  // console.log(params.nonceStr);
  // console.log(params.signType);
  // console.log(params.package);
  // console.log(params.timeStamp);
  // console.log(params.appId);
  // console.log(params.paySign);
  // console.log('sdsd');
  // wx.chooseWXPay({
  //   // ...params,
  //   appId: params.appId,
  //   timestamp: params.timeStamp,
  //   nonceStr: params.nonceStr,
  //   package: params.package,
  //   signType: params.signType,
  //   paySign: params.paySign,
  //   success(res) {
  //     console.log(res);
  //     // resolve(res);
  //     successCallback(res)
  //   },
  //   fail() {
  //     failCalback();
  //   },
  //   cancel() {
  //     failCalback();
  //   }
  // });
}
export const makeWavWxOrder = async ({ wid }, successCallback, failCalback) => {
  const res = await createOrder({ pid:7, wid })
  const orderId = res.data.data;
  payWxOrder({ orderId }, successCallback, failCalback)
}
export const payWxOrder = async ({ orderId }, successCallback, failCalback) => {
  const payResult = await payOrder({ orderId })
  // alert(JSON.stringify(res));
  const params = payResult.data.data;
  // alert(JSON.stringify(params));
  console.log(params.nonceStr);
  console.log(params.signType);
  console.log(params.package);
  console.log(params.timeStamp);
  console.log(params.appId);
  console.log(params.paySign);
  console.log('sdsd');
  wx.chooseWXPay({
    // ...params,
    appId: params.appId,
    timestamp: params.timeStamp,
    nonceStr: params.nonceStr,
    package: params.package,
    signType: params.signType,
    paySign: params.paySign,
    success(res) {
      console.log(res);
      // resolve(res);
      successCallback(res)
    },
    fail() {
      failCalback();
    },
    cancel() {
      failCalback();
    }
  });
}
// });

export const createAddress = (cb1, cb2) => {
  wx.openAddress({
    success(res) {
      cb1(res);
    },
    cancel() {
      cb2();
    },
  });
}
// address
// export const newMakeWxOrder = ({ pid, wid, amount }, cb1, cb2) => {
//   console.log(res);
//   createOrder({ pid, wid, amount, address: res }).then((res) => {
//     const orderId = res.data.data;
//     payOrder({ orderId }).then((res) => {
//       // alert(JSON.stringify(res));
//       const params = res.data.data;
//       alert(JSON.stringify(params));
//       console.log(params.nonceStr);
//       console.log(params.signType);
//       console.log(params.package);
//       console.log(params.timeStamp);
//       console.log(params.appId);
//       console.log(params.paySign);
//       console.log('1234');
//       wx.chooseWXPay({
//         // ...params,
//         appId: params.appId,
//         timestamp: params.timeStamp,
//         nonceStr: params.nonceStr,
//         package: params.package,
//         signType: params.signType,
//         paySign: params.paySign,
//         success(res) {
//           console.log(res);
//           cb1(res);
//         },
//         fail() {
//           cb2();
//         },
//         cancel() {
//           cb2();
//         }
//       });
//     });
//   });
// }

// export const getAddress = () => {
//   new Promise((resolve, reject) => {
//     wx.openAddress({
//       success(res) {
//         console.log(res);
//         resolve(res);
//       },
//       cancel() {
//         reject();
//       },
//     });
//   });
// };
// 调用分享
// $_wechat().config().then((res) => {
//   $_wechat().share({ // 配置分享
//     title: 'wechat-spa',
//     desc: 'Wechat SPA',
//     fullPath: '/home/index',
//     imgUrl: 'https://www.baidu.com/img/bd_logo1.png',
//   });
// }, (err) => {
//   console.warn(err);
// });

export const selectAndUploadImage = (cb1, cb2) => {
  wx.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
    success: function (res) {
      const localId = res.localIds[0]; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
      wx.uploadImage({
        localId, // 需要上传的图片的本地ID，由chooseImage接口获得
        isShowProgressTips: 1, // 默认为1，显示进度提示
        success: async function (res) {
          const serverId = res.serverId
          const imgRes = await getWXMedia({ media_id: serverId })
          // const imgUrl = localId // for now...
          console.log('file derived', imgRes)
          cb1(imgRes.data.data)
        },
        fail: function (error) {
          cb2()
        }
      });
    }
  });
}