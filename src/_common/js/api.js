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
    console.log('record', record);
    // record = [{"note":"E6","time":0},{"note":"Eb6","time":0.314},{"note":"E6","time":0.675},{"note":"Eb6","time":0.989},{"note":"E6","time":1.351},{"note":"B5","time":1.656},{"note":"D6","time":2},{"note":"C6","time":2.325},{"note":"A4","time":2.706},{"note":"A5","time":2.711},{"note":"E5","time":3.442},{"note":"C5","time":3.442},{"note":"C5","time":3.792},{"note":"E5","time":4.132},{"note":"A5","time":4.469},{"note":"B5","time":4.818},{"note":"Ab4","time":4.833},{"note":"D5","time":5.551},{"note":"B4","time":5.556},{"note":"E5","time":5.953},{"note":"Ab5","time":6.3},{"note":"B5","time":6.609},{"note":"C6","time":6.936},{"note":"A4","time":6.971},{"note":"E5","time":7.666},{"note":"C5","time":7.666},{"note":"E5","time":8.014},{"note":"E6","time":8.318},{"note":"Eb6","time":8.651},{"note":"E6","time":8.997},{"note":"Eb6","time":9.327},{"note":"E6","time":9.629},{"note":"B5","time":10.013},{"note":"D6","time":10.375},{"note":"C6","time":10.728},{"note":"A4","time":11.086},{"note":"A5","time":11.087},{"note":"E5","time":11.787},{"note":"C5","time":11.858},{"note":"C5","time":12.215},{"note":"E5","time":12.59},{"note":"A5","time":12.938},{"note":"Ab4","time":13.307},{"note":"B5","time":13.313},{"note":"B4","time":14.053},{"note":"D5","time":14.061},{"note":"D5","time":14.4},{"note":"C6","time":14.87},{"note":"B5","time":15.438},{"note":"A4","time":16.068},{"note":"A5","time":16.099},{"note":"C5","time":16.535},{"note":"E5","time":17.027},{"note":"A5","time":17.627}]

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
export function updateWork({ id, title, cover, content }) {
  return axios.put(
    `//api.octave-love.com/api/v1/work/updateWork/${id}`,
    JSON.stringify({ title, cover, content }),
    reqConfig,
  );
  // .then((res) => { console.log(res); })
  // .catch((err) => { console.log(err); });
}
export function getRecommendations() {
  return axios.post('//api.octave-love.com/api/v1/home', '', reqConfig);
}

export function createOrder({ pid, wid, amount, addressId }) {
  return axios.post(
    '//api.octave-love.com/api/v1/shop/orders/create',
    JSON.stringify({ pid, wid, amount, addressId }),
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

export function sendAddress(addressVO) {
  return axios.post(
    '//api.octave-love.com/api/v1/shop/address/create',
    JSON.stringify(addressVO),
    reqConfig
  )
}
export function fetchProductList() {
  return axios.get(
    '//api.octave-love.com/api/v1/admin/shop/products',
    reqConfig
  )
}
