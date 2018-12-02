import axios from 'axios';
import wx from 'weixin-js-sdk';

const reqConfig = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};
export const prepareShareConfig = () => new Promise((resolve, reject) => {
  axios.post(`//api.octave-love.com/api/v1/wechat/getTicket?url=${encodeURIComponent(window.location.href.split('#')[0])}`, '', reqConfig)
  .then((res) => {
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
      ],
    });
    wx.ready(() => { // 配置wx.config成功
      resolve(wx);
    });
  }, () => {
    reject('配置wx.config失败');
  });
});

  // 分享配置
export const prepareShareContent = ({
    title,
    desc,
    fullPath,
    imgUrl,
  }) => {
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
