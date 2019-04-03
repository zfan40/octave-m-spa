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
    // 'Authorization': 'eyJhbGciOiJIUzI1NiJ9.eyJ1aWQiOjIzOSwic3ViIjoiMjM5IiwiZXhwIjoxNTU1MjIyNzcxLCJpYXQiOjE1NTI2MzA3NzEsImp0aSI6IjE1NTI2MzA3NzE2MzgifQ.J1WNccABxwadbcjF-GsCLUhBhyROpcxP52g6JXW0vKI'
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
              expires: 30,
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
    console.log('record', record);
    // record = [{ "note": "E4", "time": 0 }, { "note": "E5", "time": 0.098 }, { "note": "G5", "time": 1.058 }, { "note": "G4", "time": 1.074 }, { "note": "A5", "time": 1.074 }, { "note": "A4", "time": 1.102 }, { "note": "C5", "time": 1.19 }, { "note": "G5", "time": 1.69 }, { "note": "A5", "time": 2.029 }, { "note": "A4", "time": 2.047 }, { "note": "A5", "time": 2.109 }, { "note": "F5", "time": 2.198 }, { "note": "G5", "time": 2.587 }, { "note": "A5", "time": 2.646 }, { "note": "C6", "time": 3.082 }, { "note": "A5", "time": 3.582 }, { "note": "A4", "time": 3.7 }, { "note": "A5", "time": 3.702 }, { "note": "G4", "time": 4.541 }, { "note": "G5", "time": 4.569 }, { "note": "E5", "time": 5.074 }, { "note": "E4", "time": 5.075 }, { "note": "C5", "time": 6.015 }, { "note": "E5", "time": 6.209 }, { "note": "E4", "time": 6.239 }, { "note": "G5", "time": 6.498 }, { "note": "A5", "time": 6.881 }, { "note": "G5", "time": 7.331 }, { "note": "E5", "time": 7.778 }, { "note": "E4", "time": 7.779 }, { "note": "G5", "time": 8.445 }, { "note": "G4", "time": 8.46 }, { "note": "F5", "time": 8.966 }, { "note": "A4", "time": 9.059 }, { "note": "A5", "time": 9.06 }, { "note": "A5", "time": 9.449 }, { "note": "C6", "time": 9.866 }, { "note": "A4", "time": 10.126 }, { "note": "A5", "time": 10.127 }, { "note": "A5", "time": 10.317 }, { "note": "A5", "time": 11.56 }, { "note": "A4", "time": 11.598 }, { "note": "C5", "time": 11.6 }, { "note": "B4", "time": 11.8 }, { "note": "E5", "time": 12.093 }, { "note": "C5", "time": 12.168 }, { "note": "E5", "time": 12.18 }, { "note": "B4", "time": 12.206 }, { "note": "G5", "time": 12.373 }, { "note": "G4", "time": 12.404 }, { "note": "G5", "time": 12.73 }, { "note": "E5", "time": 13.005 }, { "note": "E4", "time": 13.007 }, { "note": "E5", "time": 13.864 }, { "note": "F5", "time": 14.708 }, { "note": "F4", "time": 14.744 }, { "note": "E4", "time": 15.04 }, { "note": "E5", "time": 15.098 }, { "note": "D5", "time": 15.478 }, { "note": "D4", "time": 15.479 }, { "note": "D5", "time": 16.1 }, { "note": "G5", "time": 16.573 }, { "note": "B5", "time": 16.901 }, { "note": "G5", "time": 17.33 }, { "note": "C4", "time": 17.382 }, { "note": "C5", "time": 17.426 }, { "note": "C5", "time": 17.749 }, { "note": "E5", "time": 18.796 }, { "note": "F5", "time": 19.343 }]

    // add a track
    // midi
    //   .track()
    //   // select an instrument by its MIDI patch number
    //   .patch(32)
    //   // chain note events: note, time, duration
    //   .note(60, 0, 2)
    //   .note(63, 1, 2)
    //   .note(60, 2, 2);

    record.reduce((acc, cur) => {
      return acc.note(
        Tone.Frequency(cur.note).toMidi(),//midiNo,
        cur.time, //startTime,
        1//duration,
        //velocity
      );
    }, midi.track(0).patch(32));

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
    `//api.octave-love.com/api/v1/work/getListByUid/${id}?page=${page}&size=14`,
    reqConfig,
  );
}
export function fetchFavWorks(id, page) {
  return axios.get(
    `//api.octave-love.com/api/v1/favorite/getWorkList/${id}?page=${page}&size=14`,
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
export function updateWork({ id, title, cover, content, status }) {
  return axios.put(
    `//api.octave-love.com/api/v1/work/updateWork/${id}`,
    JSON.stringify({ title, cover, content, status }),
    reqConfig,
  );
  // .then((res) => { console.log(res); })
  // .catch((err) => { console.log(err); });
}
export function getRecommendations() {
  return axios.post('//api.octave-love.com/api/v1/home', '', reqConfig);
}

export function createOrder({ pid, wid, amount, addressId, message }) {
  return axios.post(
    '//api.octave-love.com/api/v1/shop/orders/create',
    JSON.stringify({ pid, wid, amount, addressId, message }),
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
export function fetchOrders(page) {
  return axios.get(`//api.octave-love.com/api/v1/shop/orders/myOrderList?page=${page}&size=14`, reqConfig,
  );
}

export function sendAddress(addressVO) {
  return axios.post(
    '//api.octave-love.com/api/v1/shop/address/create',
    JSON.stringify(addressVO),
    reqConfig
  )
}
export function getWXMedia({ media_id }) {
  return axios.post(`//api.octave-love.com/api/v1/wechat/saveMedia?media_id=${media_id}`,
    '',
    reqConfig,
  );
}
export function fetchProductList() {
  return axios.get(
    '//api.octave-love.com/api/v1/admin/shop/products',
    reqConfig
  )
}

export function fetchStacks({ page, size }) {
  return axios.get(
    `//api.octave-love.com//api/v1/admin/works?page=${page}&size=${size}`,
    reqConfig
  )
}

export function fetchSquareWorks({ page, size, id }) {
  return axios.get(
    `//api.octave-love.com/api/v1/home?page=${page}&size=${size}`,
    reqConfig,
  );
}
