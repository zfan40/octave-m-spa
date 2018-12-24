import axios from 'axios';
import wx from 'weixin-js-sdk';
import { createOrder, payOrder } from './api';

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
    success() {},
    cancel() {},
  });
  wx.onMenuShareAppMessage({
    title,
    desc,
    link,
    imgUrl,
    success() {},
    cancel() {},
  });
};

// order pay
export const makeWxOrder = ({ pid, wid, amount }) =>
  new Promise((resolve, reject) => {
    getAddress().then((address) => {
      console.log('234', address);
      createOrder({ pid, wid, amount }).then((res) => {
        // 得到返回的支付参数
        alert(JSON.stringify(res));
        const orderId = res.data.data;
        // params.success = (res) => {
        //   // 支付成功
        // };
        payOrder({ orderId }).then((res) => {
          // alert(JSON.stringify(res));
          const params = res.data.data;
          alert(JSON.stringify(params));
          console.log(params.nonceStr);
          console.log(params.signType);
          console.log(params.package);
          console.log(params.timeStamp);
          console.log(params.appId);
          console.log(params.paySign);
          console.log('sdsd');
          // WeixinJSBridge.invoke(
          //   'getBrandWCPayRequest',
          //   {
          //     nonceStr: params.nonceStr || 'e3bcr07pOMTlSmo8xEtbjzCkhRQzUuEX',
          //     signType: params.signType || 'MD5',
          //     package: params.package || 'prepay_id=wx23170809963259d77f75f3450235551609',
          //     timeStamp: params.timeStamp || '1545556090',
          //     appId: params.appId || 'wx353a60a8b049d366',
          //     paySign: params.paySign || '1855DBE80F3E3EF13A956D87802CD52E',
          //   },
          //   (res) => {
          //     if (res.err_msg == 'get_brand_wcpay_request:ok') {
          //       // 使用以上方式判断前端返回,微信团队郑重提示：
          //       // res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
          //     }
          //   },
          // );
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
              resolve(res);
            },
          });
        });
      });
    });
  });

// address
export const getAddress = () => {
  new Promise((resolve, reject) => {
    wx.openAddress({
      success(res) {
        console.log(res);
        resolve(res);
      },
      cancel() {
        reject();
      },
    });
  });
};
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
