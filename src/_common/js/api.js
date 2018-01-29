import * as Cookies from 'js-cookie';

const axios = require('axios');

const reqConfig = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};
// TODO:cause 500?????? just cuz this few lines???


export function getUserInfo(wxcode) {
  const tokenInCookie = Cookies.get('serviceToken');
  if (tokenInCookie) {
    // alert('cookie used');
    reqConfig.headers.Authorization = `Bearer ${tokenInCookie}`;
    return axios.post('//api.musixise.com/api/user/getInfo', '', reqConfig);
  } else if (!tokenInCookie && wxcode) {
    // alert('no cookie');
    return new Promise((resolve, reject) => {
      axios.post(`//api.musixise.com/api/user/oauth/wechat/callback?code=${wxcode}`, '', reqConfig)
        .then((res) => {
          if (res.data.errcode === 20001) {
            reject(20001); // 相当于return了
          }
          const serviceToken = res.data.data.id_token;
          reqConfig.headers.Authorization = `Bearer ${serviceToken}`;
          Cookies.set('serviceToken', serviceToken, {
            expires: 7,
          });
          return axios.post('//api.musixise.com/api/user/getInfo', '', reqConfig);
        }, () => {
          reject();
        })
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  // !tokenInCookie&&!wxcode的情况在app.js里处理, 不会走到这里
  return false;
}

export function uploadRecord(record, info) {
  return new Promise((resolve, reject) => {
    const formReqConfig = { headers: { 'Content-Type': 'multipart/form-data', processData: false } };
    const blob = new Blob([JSON.stringify(record)]);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fd = new FormData();
      fd.append('fname', 'test.txt');
      fd.append('data', event.target.result);
      const postFix = await axios.post('//api.musixise.com/api/uploadAudio', fd, formReqConfig);
      const workURL = `http://oiqvdjk3s.bkt.clouddn.com/${postFix.data.data}`;
      const param = {
        ...info,
        url: workURL,
      };
      console.log(workURL);
      return axios.post('//api.musixise.com/api/work/create', JSON.stringify(param), reqConfig)
               .then((res) => {
                 resolve(res.data.data.id);
               })
               .catch((err) => {
                 reject(err);
               });
    };
    reader.readAsDataURL(blob);
  });
  // trigger the read from the reader...
}

export function fetchMbox(id) {
  return axios.post(`//api.musixise.com/api/work/detail/${id}`, '', reqConfig);
}
