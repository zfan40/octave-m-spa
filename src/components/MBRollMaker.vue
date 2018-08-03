<script>
const Tone = require('tone')
import * as Util from '../_common/js/util'
import * as Api from '../_common/js/api'
import * as Cookies from "js-cookie"
import * as Magic from '../_common/js/magic'
// import countButton from './common/countButton'
import * as WxShare from '../_common/js/wx_share'
let musicPart = undefined
import Vue from 'vue'
import VueKonva from 'vue-konva'
let last_i = -1
let last_j = -1
Vue.use(VueKonva)
var piano = new Tone.Sampler({
  'C4': 'C4.[mp3|ogg]',
  'D#4': 'Ds4.[mp3|ogg]',
  'F#4': 'Fs4.[mp3|ogg]',
  'A4': 'A4.[mp3|ogg]',
  'C5': 'C5.[mp3|ogg]',
  'D#5': 'Ds5.[mp3|ogg]',
  'F#5': 'Fs5.[mp3|ogg]',
  'A5': 'A5.[mp3|ogg]',
  'C6': 'C6.[mp3|ogg]',
}, {
  'release': 1,
  // 'baseUrl': '/static/audio/'
  'baseUrl': '//cnbj1.fds.api.xiaomi.com/mbox/audio/'
}).toMaster()
export default {
  components: {
    // countButton,
  },
  data() {
    return {
      configKonva: {
        width: 0,
        height: 0
      },
      configNoteRect: {

      },
      rectArray: [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
      ]
    }
  },
  computed: {

  },
  methods: {
    setupCanvas() {
      const docElem = document.documentElement;
      this.configKonva = {
        width: docElem.getBoundingClientRect().width - 60,
        height: window.innerHeight * 4
      };
      this.configNoteRect = {
        width: (docElem.getBoundingClientRect().width - 60) / 18,
        height: window.innerHeight / 20,
        fill: '#ccc',
        stroke: '#fff',
        strokeWidth: 1
      }
    },
    setupRect(i, j) {
      return {
        ...this.configNoteRect,
        x: i * this.configKonva.width / 18,
        y: j * this.configKonva.height / 80,
        fill: this.rectArray[i][j]?'#fc3':'#ccc'
      }
    },
    handleTouchRect(i, j) {
      last_i = i
      last_j = j
      piano.triggerAttackRelease(Tone.Frequency(60 + i, "midi"), 0.5)

      // this.rectArray[i][j] = !this.rectArray[i][j]
      // this is how to assign a two dim array in vue2.0...
      const newRow = this.rectArray[i].slice(0)
      newRow[j] = !newRow[j]
      this.$set(this.rectArray,i,newRow)
    },
    handleMoveRect(i, j) {
      if (i != last_i || j != last_j) {
        piano.triggerAttackRelease(Tone.Frequency(60 + i, "midi"), 0.5)
        // this.rectArray[i][j] = !this.rectArray[i][j]
        // this is how to assign a two dim array in vue2.0...
        const newRow = this.rectArray[i].slice(0)
        newRow[j] = !newRow[j]
        this.$set(this.rectArray,i,newRow)

        console.log(`trigger ${i},${j}`)
        last_i = i
        last_j = j
      } else {
        // console.log(`ignore ${i},${j}`)
      }
    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone()
    next()
  },
  created() {
    this.setupCanvas()
    // const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase())
    // if (!inWechat) return
    // if (Util.getUrlParam('code') || Cookies.get('serviceToken')) {
    //   //TODO:ajax call to get info
    //   Api.getUserInfo(Util.getUrlParam('code'))
    //     .then((res) => {
    //       if (res.data.errcode >= 20000) {
    //         // 网页内cookie失效，需要重新验证
    //         Cookies.remove('serviceToken')
    //         location.replace(
    //           'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
    //         )
    //       }
    //       alert(`welcome${res.data.data.realname}`)
    //       console.log('get user info success', res.data.data)
    //     })
    //     .catch((err) => {
    //       Cookies.remove('serviceToken')
    //       location.replace(
    //         'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
    //       )
    //     })
    // } else { //又没有微信给的auth code又没有token存在cookie，只得验证
    //   location.replace(
    //     'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
    //   )
    // }
  },
  mounted() {

  },
  updated() {}
};
</script>

<template>
<v-stage :config="configKonva">
  <v-layer>
    <template v-for='i in 18'>
      <v-rect v-for='j in 80'
      @touchstart="handleTouchRect(i-1,j-1)"
      @touchmove="handleMoveRect(i-1,j-1)"
      :config="setupRect(i-1,j-1)" />
    </template>
  </v-layer>
</v-stage>
</template>

<style lang="scss" scoped>
@import '../_common/style/_functions.scss';
@import '../_common/style/_variables.scss';
@import '../_common/style/_mixins.scss';
@import '../_common/style/_reboot.scss';
canvas {
    transition: translate 1s ease-out;
}
</style>
