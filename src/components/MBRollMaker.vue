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
let aInterval = undefined;
const TIME_PER_NOTE = 0.25
const FULL_NOTE_NUM = 80 //80 notes, then if set 20 per page, it would be 4 pages
const NOTE_NUM_PER_SECTOR = 10
Vue.use(VueKonva)
var synth = new Tone.Sampler({
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
var pulseOptions = {
  oscillator: {
    type: "triangle"
  },
  envelope: {
    release: 0.07
  }
};
const piano = new Tone.PolySynth(18, Tone.Synth, pulseOptions).toMaster();
export default {
  components: {
    // countButton,
  },
  data() {
    return {
      NOTE_CATEGORY: 18,
      ONE_PAGE_NOTE_NUM: 20,
      NOTE_NUM_PER_SECTOR,
      tempo: 120,
      configKonva: {
        width: 0,
        height: 0
      },
      configNoteRect: {

      },
      activeJ: -1, // highlight timeline
      sector: 1, // 2*4-1,可以滚动7次，营造处4页的氛围
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
      ],
      alertAppear: false,
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
      for (let j = 0; j <= FULL_NOTE_NUM - 1; j++) {
        for (let sector = 0; sector <= this.sector; sector++) {
          // console.log(111)
          Tone.Transport.scheduleRepeat((time) => {
            this.activeJ = j + (sector - 1) * this.NOTE_NUM_PER_SECTOR
          }, FULL_NOTE_NUM * TIME_PER_NOTE * 120 / this.tempo, (j + (sector - 1) * this.NOTE_NUM_PER_SECTOR) * TIME_PER_NOTE * 120 / this.tempo);
        }
      }

    },
    setupRect(i, j, sector) {
      let fill = '';
      // split NOTE_NUM_PER_SECTOR and this.NOTE_NUM_PER_SECTOR for ANIMATION!!!
      if (j + (sector-2)*NOTE_NUM_PER_SECTOR + 1 * this.NOTE_NUM_PER_SECTOR == this.activeJ &&
        this.rectArray[i][j + (sector-2)*NOTE_NUM_PER_SECTOR + 1 * this.NOTE_NUM_PER_SECTOR]) {
        // active current note: lighter color
        fill = colors[i]
      } else if (
        j + (sector-2)*NOTE_NUM_PER_SECTOR + 1 * this.NOTE_NUM_PER_SECTOR == this.activeJ &&
        !this.rectArray[i][j + (sector-2)*NOTE_NUM_PER_SECTOR + 1 * this.NOTE_NUM_PER_SECTOR]
      ) {
        // inactive current light blue
        fill = '#f0f8ff'
      } else if (this.rectArray[i][j + (sector-2)*NOTE_NUM_PER_SECTOR + 1 * this.NOTE_NUM_PER_SECTOR]) {
        // active non-current note
        fill = colors[i]
      } else {
        // incative non-current note
        fill = '#fff';
      }
      return {
        ...this.configNoteRect,
        x: i * this.configKonva.width / this.NOTE_CATEGORY,
        y: j * this.configKonva.height / this.ONE_PAGE_NOTE_NUM,
        fill
      }
    },
    handleTouchRect(i, j, sector) {
      // console.log(`trigger ${i},${j+(sector-1)*this.NOTE_NUM_PER_SECTOR}`)
      // make sound
      synth.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)
      // this.rectArray[i][j] = !this.rectArray[i][j] // this is how to assign a two dim array in vue 2.0...
      const newRow = this.rectArray[i].slice(0)
      newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]
      this.$set(this.rectArray, i, newRow)
      // schedule/clearEvent
      if (newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]) { //schedule
        schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = Tone.Transport.scheduleRepeat((time) => {
          synth.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)
        }, FULL_NOTE_NUM * TIME_PER_NOTE * 120 / this.tempo, (j + (sector - 1) * this.NOTE_NUM_PER_SECTOR) * TIME_PER_NOTE * 120 / this.tempo);
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
        this.handleTouchRect(i, j, sector)
      } else if (i != last_i && j == last_j) { // take this as testing note, no store, no arrange
        // make sound
        synth.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)

        // operate current note view
        const newRow = this.rectArray[i].slice(0)
        newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]
        this.$set(this.rectArray, i, newRow)

        // operate current note scheduling
        if (newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]) { // to activate the note
          schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = Tone.Transport.scheduleRepeat((time) => {
            // this.activeJ = j + (sector - 1) * this.NOTE_NUM_PER_SECTOR
            // console.log('bibibi', this.activeJ)
            synth.triggerAttackRelease(Tone.Frequency(60 + musicScale[i], "midi"), 0.5)
          }, FULL_NOTE_NUM * TIME_PER_NOTE * 120 / this.tempo, (j + (sector - 1) * this.NOTE_NUM_PER_SECTOR) * TIME_PER_NOTE * 120 / this.tempo);
          console.log(`schedule ${i},${j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
        } else {
          Tone.Transport.clear(schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
          console.log(`clear ${i},${j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[i][j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
        }
        // restore last note view
        const newLastRow = this.rectArray[last_i].slice(0)
        newLastRow[last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newLastRow[last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]
        this.$set(this.rectArray, last_i, newLastRow)
        // restore last note scheduling
        if (newLastRow[last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]) {
          schedules[last_i][last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = Tone.Transport.scheduleRepeat((time) => {
            // this.activeJ = j + (sector - 1) * this.NOTE_NUM_PER_SECTOR
            // console.log('bibibi', this.activeJ)
            synth.triggerAttackRelease(Tone.Frequency(60 + musicScale[last_i], "midi"), 0.5)
          }, FULL_NOTE_NUM * TIME_PER_NOTE * 120 / this.tempo, (last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR) * TIME_PER_NOTE * 120 / this.tempo);
          console.log(`reschedule ${last_i},${last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[last_i][last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
        } else {
          console.log(`reclear ${last_i},${last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR}`, schedules[last_i][last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
          Tone.Transport.clear(schedules[last_i][last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR])
        }
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
    scrolldown() {
      clearInterval(aInterval)
      this.sector == (FULL_NOTE_NUM / NOTE_NUM_PER_SECTOR - 1) ?this.NOTE_NUM_PER_SECTOR = NOTE_NUM_PER_SECTOR-2:this.NOTE_NUM_PER_SECTOR = 1 // for animation,
      this.sector <= (FULL_NOTE_NUM / NOTE_NUM_PER_SECTOR - 2) ? this.sector += 1 : '' // this line is real scroll down
      // below is for animation
      aInterval = setInterval(()=>{this.NOTE_NUM_PER_SECTOR+=1;if(this.NOTE_NUM_PER_SECTOR==10) {
        clearInterval(aInterval)
      }},50)
    },
    scrollup() {
      clearInterval(aInterval)
      this.sector == 1 ?this.NOTE_NUM_PER_SECTOR = NOTE_NUM_PER_SECTOR+2:this.NOTE_NUM_PER_SECTOR = 20 // for animation,
      this.sector >= 2 ? this.sector -= 1 : ''
      aInterval = setInterval(()=>{this.NOTE_NUM_PER_SECTOR-=1;if(this.NOTE_NUM_PER_SECTOR==10) {
        clearInterval(aInterval)
      }},50)
    },
    checkBouncibility() {
      const result = []
      for (let i = 0; i <= this.NOTE_CATEGORY - 1; i++) {
        for (let j = 0; j <= FULL_NOTE_NUM - 1; j++) {
          if (this.rectArray[i][j]) {
            result.push({
              note: Tone.Frequency(60 + musicScale[i], "midi").toNote(),
              time: j * TIME_PER_NOTE * 120 / this.tempo
            })
          }
        }
      }
      result.sort((a, b) => (0 + a.time - b.time))
      return Magic.RealMagic(result)
    },
    bounceProject() {
      // finally get something like [{note:'A4',time:0},{note:'A5',time:0.3227}]
      const result = []
      for (let i = 0; i <= this.NOTE_CATEGORY - 1; i++) {
        for (let j = 0; j <= FULL_NOTE_NUM - 1; j++) {
          if (this.rectArray[i][j]) {
            result.push({
              note: Tone.Frequency(60 + musicScale[i], "midi").toNote(),
              time: j * TIME_PER_NOTE * 120 / this.tempo
            })
          }
        }
      }
      this.$store.dispatch('BOUNCE_PROJECT', {
        record: result,
        info: {
          title: '尚未起名',
          content: 'default',
          cover: 'default'
        },
      }).then(id => {
        console.log('successfully bounced')
        this.bouncing = false;
        this.$toast('作品已为您存储')
        this.$router.push({
          path: '/new-music-box-viewer',
          query: {
            id
          }
        })
      }).catch((err) => {
        this.bouncing = false;
        this.$toast('非常抱歉，上传作品失败了')
      })
    },
    submitProject() {
      if (this.checkBouncibility()) {
        alert(1)
        this.bounceProject()
      } else {
        alert(2)
        this.alertAppear = true;
      }
    },
    clearProject() {

    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone()
    next()
  },
  created() {
    this.setupCanvas()
    schedules = JSON.parse(JSON.stringify(this.rectArray))
    
    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase())
    if (!inWechat) return
    if (Util.getUrlParam('code') || Cookies.get('serviceToken')) {
      Api.getUserInfo(Util.getUrlParam('code'))
        .then((res) => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove('serviceToken')
            location.replace(
              'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
            )
          }
          alert(`welcome${res.data.data.realname}`)
          console.log('get user info success', res.data.data)
        })
        .catch((err) => {
          Cookies.remove('serviceToken')
          location.replace(
            'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
          )
        })
    } else { //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
      )
    }
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
    <div @touchstart="clearProject">x</div>
    <div @touchstart="submitProject">✓</div>
  </div>
  <transition name="fade">
    <div id="alert-mask" v-show="alertAppear">
      <div class="mb-dialog">
        <div class="title">
          减少些音符才能做成音乐盒，是否继续上传
        </div>
        <div class="btns">
          <span class="btn cancel" @click="alertAppear=false">再调整</span>
          <span class="btn confirm" @click="bounceProject">任性上传</span>
        </div>
      </div>
    </div>
  </transition>
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

.fadein {
    animation: fadein 1s;
    animation-fill-mode: forwards;
}

.fadeout {
    animation: fadeout 1s;
    animation-fill-mode: forwards;
}
@keyframes fadein {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}
@keyframes fadeout {
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}
#alert-mask {
  position: absolute;top:0;width:100%;height:100%;background-color:rgba(0,0,0,.3);display: flex;align-items: center;justify-content: center;
  .mb-dialog {
    position: relative;rotate:90deg;width: getRem(570);padding-top:getRem(75); border-radius:getRem(50);height:getRem(344);background-color:rgba(255,255,255,.96);display:flex;flex-direction:column;
    .title {flex:1;padding:0 getRem(77); display:flex;align-items:flex-end;position: relative;width:100%;font-size:.32rem;}
    .input {
      flex:2;flex-direction: column;padding:0 getRem(77);display:flex;align-items:flex-start;justify-content: center;position: relative;width:100%;text-align: center;font-size:.5rem;
      input {background: transparent;border: none;outline: none;width: 100%; height:1rem;font-size:.54rem;}
      .splitter {position:relative;width:100%;height:1px;background-color:gray;padding:0 getRem(77);}
    }
    .btns {
      flex:4;display:flex;align-items:center;justify-content: center;position: relative;width:100%;text-align: center;font-size:.5rem;
      span.btn {
        position: relative;width:100%;height:100%;flex:1;display:flex;align-items:center;padding-top:.6rem;
      }
      .cancel {color:gray;text-align: right;justify-content: flex-start;padding-left:getRem(77);}
      .confirm { color:blue;text-align: left;justify-content: flex-end;padding-right:getRem(77);}
    }
  }
}
</style>
