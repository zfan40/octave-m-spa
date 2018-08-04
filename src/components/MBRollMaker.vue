<script>
window.Tone = require('tone')
import * as Util from '../_common/js/util'
import * as Api from '../_common/js/api'
import * as Cookies from "js-cookie"
import * as Magic from '../_common/js/magic'
// import countButton from './common/countButton'
import * as WxShare from '../_common/js/wx_share'
let musicPart = undefined
import Vue from 'vue'
import VueKonva from 'vue-konva'
const musicScale = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24, 26, 28, 29]
const colors = ['#8fd3c7', '#95c631', '#edda28', '#f7943d', '#e43159', '#bf4ea8', '#4d61d9', '#45b5a1', '#8fd3c7', '#95c631', '#edda28', '#f7943d', '#e43159', '#bf4ea8', '#4d61d9', '#45b5a1', '#edda28', '#f7943d']
let last_i = -1
let last_j = -1
window.schedules = []

const TIME_PER_NOTE = 0.25
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
      NOTE_CATEGORY: 18,
      ONE_PAGE_NOTE_NUM: 20,
      NOTE_NUM_PER_SECTOR: 10,
      tempo: 120,
      configKonva: {
        width: 0,
        height: 0
      },
      configNoteRect: {

      },
      sector: 1, //2*4-1,可以滚动7次，营造处4页的氛围
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
        height: window.innerHeight
      };
      this.configNoteRect = {
        width: (docElem.getBoundingClientRect().width - 60) / this.NOTE_CATEGORY,
        height: window.innerHeight / this.ONE_PAGE_NOTE_NUM,
        fill: '#fff',
        stroke: '#d2ecfc',
        strokeWidth: 1
      }
    },
    setupRect(i, j, sector) {
      return {
        ...this.configNoteRect,
        x: i * this.configKonva.width / this.NOTE_CATEGORY,
        y: j * this.configKonva.height / this.ONE_PAGE_NOTE_NUM,
        fill: this.rectArray[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] ? colors[i] : '#fff'
      }
    },
    handleTouchRect(i, j, sector) {
      // console.log(`trigger ${i},${j+(sector-1)*this.NOTE_NUM_PER_SECTOR}`)
      // make sound
      piano.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)
      // this.rectArray[i][j] = !this.rectArray[i][j] // this is how to assign a two dim array in vue 2.0...
      const newRow = this.rectArray[i].slice(0)
      newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]
      this.$set(this.rectArray, i, newRow)
      // schedule/clearEvent
      if (newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]) { //schedule
        // schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = Tone.Transport.schedule((time) => {
        //   // invoked when the Transport starts
        //   piano.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)
        // }, (j + (sector - 1) * this.NOTE_NUM_PER_SECTOR) * TIME_PER_NOTE);
        schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = Tone.Transport.scheduleRepeat((time) => {
          // invoked when the Transport starts
          piano.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)
        }, 40 * TIME_PER_NOTE, (j + (sector - 1) * this.NOTE_NUM_PER_SECTOR) * TIME_PER_NOTE);
        console.log(`schedule ${i},${j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
      } else { // clear
        console.log(`clear ${i},${j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
        Tone.Transport.clear(schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
      }
      // update last
      last_i = i
      last_j = j
    },
    handleMoveRect(i, j, sector) {
      if (j != last_j) { // take this as real note, store arrange
        // // arrange last note!
        // schedules[last_i][last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = Tone.Transport.scheduleRepeat((time) => {
        //   // invoked when the Transport starts
        //   piano.triggerAttackRelease(Tone.Frequency(60 + musicScale[last_i], "midi"), 0.5)
        // }, 40 * TIME_PER_NOTE, (last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR) * TIME_PER_NOTE);
        // console.log(`schedule ${last_i},${last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[last_i][last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
        // // then take current as normal touchstart
        this.handleTouchRect(i, j, sector)
      } else if (i != last_i && j == last_j) { // take this as testing note, no store, no arrange
        // make sound
        piano.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)

        // highlight current note
        const newRow = this.rectArray[i].slice(0)
        newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]
        this.$set(this.rectArray, i, newRow)

        // arrange current note
        schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = Tone.Transport.scheduleRepeat((time) => {
          piano.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)
        }, 40 * TIME_PER_NOTE, (j + (sector - 1) * this.NOTE_NUM_PER_SECTOR) * TIME_PER_NOTE);
        console.log(`schedule ${i},${j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])

        // cancel highlight last note
        const newLastRow = this.rectArray[last_i].slice(0)
        newLastRow[last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newLastRow[last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]
        this.$set(this.rectArray, last_i, newLastRow)

        // clear last note
        console.log(`clear ${last_i},${last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[last_i][last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
        Tone.Transport.clear(schedules[last_i][last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])

        // update last
        last_i = i
        last_j = j
      } else {
        // console.log(`ignore ${i},${j}`)
      }
    },
    startloop() {
      Tone.Transport.start('+0.1')
    },
    stoploop() {
      Tone.Transport.stop()
    },
    minusTempo() {
      this.tempo -= 10
      Tone.Transport.bpm.rampTo(this.tempo, .1);
    },
    addTempo() {
      this.tempo += 10
      Tone.Transport.bpm.rampTo(this.tempo, .1);
    },
    scrollup() {
      // TODO:animation on scroll
      // this.NOTE_NUM_PER_SECTOR = 1;
      this.sector >= 2 ? this.sector -= 1 : this.sector
      // const a = setInterval(()=>{this.NOTE_NUM_PER_SECTOR+=1;if(this.NOTE_NUM_PER_SECTOR==10) {
      //   clearInterval(a)
      // }},100)
    },
    scrolldown() {
      // this.NOTE_NUM_PER_SECTOR = 1;
      this.sector <= 2 ? this.sector += 1 : this.sector //TODO:return to 6
      // const a = setInterval(()=>{this.NOTE_NUM_PER_SECTOR+=1;if(this.NOTE_NUM_PER_SECTOR==10) {
      //   clearInterval(a)
      // }},500)
    },
    generatePart() {

    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone()
    next()
  },
  created() {
    this.setupCanvas()
    schedules = JSON.parse(JSON.stringify(this.rectArray))
    // const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase())
    // if (!inWechat) return
    // if (Util.getUrlParam('code') || Cookies.get('serviceToken')) {
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
<div class="">
  <v-stage :config="configKonva">
    <v-layer>
      <template v-for='i in NOTE_CATEGORY'>
          <v-rect v-for='j in ONE_PAGE_NOTE_NUM'
          @touchstart="handleTouchRect(i-1,j-1,sector)"
          @touchmove="handleMoveRect(i-1,j-1,sector)"
          :config="setupRect(i-1,j-1,sector)" />
        </template>
    </v-layer>
  </v-stage>
  <div class="control-panal">
    <div @touchstart="startloop">></div>
    <div @touchstart="stoploop">口</div>
    <div @touchstart="scrollup">↑</div>
    <div @touchstart="scrolldown">↓</div>
    <div style="font-size:16px;line-height:46px;" @touchstart="minusTempo">减速</div>
    <div style="font-size:16px;line-height:46px;" @touchstart="addTempo">加速</div>
    <div @touchstart="rectArray=[[],
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
      ]">x</div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import '../_common/style/_functions.scss';
@import '../_common/style/_variables.scss';
@import '../_common/style/_mixins.scss';
@import '../_common/style/_reboot.scss';
.control-panal {
    position: absolute;
    width: 60px;
    height: 100%;
    top: 0;
    right: 0;
}
</style>
