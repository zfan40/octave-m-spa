import * as Cookies from 'js-cookie';

const axios = require('axios');

const reqConfig = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};
// TODO:cause 500?????? just cuz this few lines???
const tokenInCookie = Cookies.get('serviceToken');

export function getUserInfo(wxcode) {
  if (tokenInCookie) {
    reqConfig.headers.Authorization = `Bearer ${tokenInCookie}`;
    return axios.post('//api.musixise.com/api/user/getInfo', '', reqConfig);
  } else if (!tokenInCookie && wxcode) {
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
export function getUserInfo2(wxcode) {
  if (tokenInCookie) {
    reqConfig.headers.Authorization = `Bearer ${tokenInCookie}`;
    return axios.post('//api.musixise.com/api/user/getInfo', '', reqConfig);
  } else if (!tokenInCookie && wxcode) {
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
