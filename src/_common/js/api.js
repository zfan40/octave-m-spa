import * as Cookies from 'js-cookie';
// import Vue from 'vue';
const axios = require('axios');

axios.interceptors.response.use((res) => {
  if (res.data.errcode !== '0') {
    alert(res.data.resmsg);
    return Promise.reject(res);
  }
  return res;
});
const reqConfig = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};
// const tokenObj = { access_token: '' };
// TODO:cause 500?????? just cuz this few lines???

export function getUserInfo(wxcode) {
  const tokenInCookie = Cookies.get('serviceToken');
  if (tokenInCookie) {
    // alert('cookie used');
    reqConfig.headers.Authorization = `${tokenInCookie}`;
    // tokenObj.access_token = tokenInCookie;
    return axios.get('//api.octave-love.com/api/v1/user/getInfo', reqConfig);
  } else if (!tokenInCookie && wxcode) {
    // alert('no cookie');
    return new Promise((resolve, reject) => {
      axios
        .post(
          `//api.octave-love.com/api/v1/user/oauth/wechat/callback?code=${wxcode}`,
          '',
          reqConfig,
        )
        .then(
          (res) => {
            if (res.data.errcode === 20001) {
              reject(20001); // 相当于return了
            }
            const serviceToken = res.data.data.id_token;
            reqConfig.headers.Authorization = `${serviceToken}`;
            // tokenObj.access_token = serviceToken;
            Cookies.set('serviceToken', serviceToken, {
              expires: 7,
            });
            return axios.get('//api.octave-love.com/api/v1/user/getInfo', reqConfig);
          },
          () => {
            reject();
          },
        )
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
    // create a new midi file
    const midi = MidiConvert.create();
    // add a track
    midi
      .track()
      // select an instrument by its MIDI patch number
      .patch(32)
      // chain note events: note, time, duration
      .note(60, 0, 2)
      .note(63, 1, 2)
      .note(60, 2, 2);
    // TODO: reduce midi here
    // write the output
    // fs.writeFileSync("output.mid", midi.encode(), "binary")

    const formReqConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
        processData: false,
        Authorization: reqConfig.headers.Authorization,
      },
    };
    // const blob = new Blob([JSON.stringify(record)]);
    // const blob = new Blob([JSON.stringify(midi.encode())]);

    const binaryString = midi.encode();
    // write the output
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: 'audio/midi;charset=binary',
    });
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fd = new FormData();
      // fd.append('fname', 'test.txt');
      fd.append('fname', 'output.mid');
      fd.append('data', event.target.result);
      // fd.append('access_token', tokenObj.access_token);
      let postFix = '';
      try {
        // important, othereise dispatch won't be stoped here...
        postFix = await axios.post('//api.octave-love.com/api/v1/uploadAudio', fd, formReqConfig);
      } catch (e) {
        console.log(e);
        reject(e);
      }
      const workURL = `${postFix.data.data}`;
      const param = {
        // ...tokenObj,
        ...info, // title,content.cover
        url: workURL,
      };
      console.log(workURL);
      return axios
        .post('//api.octave-love.com/api/v1/work/create', JSON.stringify(param), reqConfig)
        .then((res) => {
          resolve(res.data.data);
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
  return axios.get(`//api.octave-love.com/api/v1/work/detail/${id}`, reqConfig);
}
export function fetchMusixiser(id) {
  return axios.get(`//api.octave-love.com/api/v1/user/detail/${id}`, reqConfig);
}
export function fetchWorksFromMusixiser(id, page) {
  return axios.get(
    `//api.octave-love.com/api/v1/work/getListByUid/${id}?page=${page}&size=15`,
    reqConfig,
  );
}
export function fetchFavWorks(id, page) {
  return axios.get(
    `//api.octave-love.com/api/v1/favorite/getWorkList/${id}?page=${page}&size=15`,
    reqConfig,
  );
}
export function toggleFavSong({ workId, status }) {
  return axios.post(
    '//api.octave-love.com/api/v1/favorite/create',
    JSON.stringify({ workId, status }),
    reqConfig,
  );
  // .then((res) => { console.log(res); })
  // .catch((err) => { console.log(err); });
}
export function updateWorkTitle({ id, title }) {
  return axios.put(
    `//api.octave-love.com/api/v1/work/updateWork/${id}`,
    JSON.stringify({ title }),
    reqConfig,
  );
  // .then((res) => { console.log(res); })
  // .catch((err) => { console.log(err); });
}
export function getRecommendations() {
  return axios.post('//api.octave-love.com/api/v1/home', '', reqConfig);
}

export function createOrder({ pid, wid, amount, address }) {
  return axios.post(
    '//api.octave-love.com/api/v1/shop/orders/create',
    JSON.stringify({ pid, wid, amount, address }),
    reqConfig,
  );
}

export function payOrder({ orderId }) {
  return axios.post(
    `//api.octave-love.com/api/v1/shop/pay/unifiedorder?orderId=${orderId}`,
    '',
    reqConfig,
  );
}
