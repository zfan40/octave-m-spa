<script>
const Tone = require('tone')
import * as Util from '../_common/js/util'
import * as Api from '../_common/js/api'
import * as Cookies from "js-cookie"
import * as Magic from '../_common/js/magic'
import * as WxShare from '../_common/js/wx_share'
import 'swiper/dist/css/swiper.css'
import vueSlider from 'vue-slider-component'
import {
  swiper,
  swiperSlide
} from 'vue-awesome-swiper'
const touchIdKeyMap = {} //touch move can have several threads, each thread only activate one note at most
// e.g. {0:a4,1:b5}

const MINI_KEY_LENGTH = 200 // px
let extendBtnsTimeout

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
  'baseUrl': '/static/audio/'
}).toMaster()

// var mbox = new Tone.Sampler({
//   'C4': 'C4.[mp3|ogg]',
//   'D#4': 'Ds4.[mp3|ogg]',
//   'F#4': 'Fs4.[mp3|ogg]',
//   'A4': 'A4.[mp3|ogg]',
//   'C5': 'C5.[mp3|ogg]',
//   'D#5': 'Ds5.[mp3|ogg]',
//   'F#5': 'Fs5.[mp3|ogg]',
//   'A5': 'A5.[mp3|ogg]',
//   'C6': 'C6.[mp3|ogg]',
// }, {
//   'release': 1,
//   'baseUrl': 'static/audio/'
// }).toMaster()

var plucky = new Tone.PluckSynth().toMaster()

const SCREEN_WIDTH = document.documentElement.getBoundingClientRect().width
const SCREEN_HEIGHT = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

let tonepart = [] // store all the music parts. (ummm,that's why it's named part...)
let bouncepart = []

let recordStartTime = 0

let isLinger = true //非播放状态中未开始录音
var replayInterval = undefined //控制progressbar的setinterval
let playOffset = 0 //播放状态的拉条bar初始时间记录
let lingerOffset = 0 //未播放状态的拉条bar初始时间记录
const PROGRESS_INTERVAL_TIME = 0.1 //0.1秒挪一下
export default {
  components: {
    swiper,
    swiperSlide,
    vueSlider,
  },
  data() {
    return {
      activeNote: {},
      recordPart: [], //current record part
      recordParts: [], //each new record goes in here.
      playing: false,
      generalControllerShow: false,
      activeSwiperIndex: 3,
      lastActiveSwiperIndex: 3 - 1,
      vuetimeline: 0,
      showExtendBtns: 0,
      timelineConfig: {
        value: 0,
        width: 8,
        height: '90%',
        padding: '0',
        dotSize: 20,
        eventType: 'auto',
        min: 0,
        max: 200,
        interval: 1,
        disabled: false,
        show: true,
        tooltip: 'always',
        // tooltip: 'hidden',
        piecewise: false,
        reverse: true,
        style: {
          display: 'inline-block',
        },
        class: 'star-slider',
        direction: 'vertical',
        speed: PROGRESS_INTERVAL_TIME,
        bgStyle: {
          backgroundColor: 'rgb(110,113,158)',
          boxShadow: 'inset 0.5px 0.5px 3px 1px rgba(0,0,0,.36)'
        },
        tooltipStyle: {
          backgroundColor: 'rgb(69, 106, 255)',
          borderColor: 'rgb(69, 106, 255)',
          // transform: 'rotate(90deg)',
        },
        formatter(value) {
          if (value) {
            return `${(value/10).toFixed(1)}s/20s`
          } else {
            return `0.0s/20s`
          }
        },
        processStyle: {
          backgroundColor: 'rgb(69,106,255)'
        }
      },
    }
  },
  watch: {
    playing: function(val) {
      console.log('playing status', val)
      if (val) {
        //start progress bar
        replayInterval = setInterval(() => {

          this.vuetimeline += 1
          if (this.vuetimeline >= 200) {
            this.toggleReplay()
            this.vuetimeline = 0

          }
        }, PROGRESS_INTERVAL_TIME * 1000)

      } else {
        //stop progress bar
        clearInterval(replayInterval)
      }
    },
  },
  computed: {
    swiper() {
      return this.$refs.pianoRoll.swiper
    },
    activePartIndex() {
      return this.PARTNUM - this.activeSwiperIndex - 1
    },
    lastActivePartIndex() {
      return this.PARTNUM - this.lastActiveSwiperIndex - 1
    }
  },
  methods: {
    load() {},
    toggleReplay() {
      console.log(1)
      this.playing = !this.playing
      if (this.playing) {
        if (this.vuetimeline >= 200) {
          this.vuetimeline = 0
        }
        // this.confirmRecordPart(!isLinger)
        playOffset = performance.now() - this.vuetimeline * 100
        console.log('播放开始')
        this.confirmRecordPart(0)
        console.log('kokokoko')
        recordStartTime = performance.now();
        console.log(`activeOffsetTime${this.vuetimeline*100}`)
        Tone.Transport.start("+0.01", this.vuetimeline * 100 / 1000) // TODO:有问题in case < context.currentTime
      } else {
        console.log('播放停了')
        Tone.Transport.stop(0) // TODO：必须stop才能start。。。有没有自动stop啊..
        // recordStartTime = performance.now()
      }
    },
    handleNoteStart(noteId) {
      let noteTime = 0
      // console.log('down', e.target.id)
      piano.triggerAttack(noteId)
      // console.log('midi no. :', Tone.Frequency(noteId).toMidi())
      this.$set(this.activeNote, noteId, 1)
      if (!this.playing) {
        if (isLinger) {
          recordStartTime = performance.now()
          lingerOffset = this.vuetimeline * 100
          isLinger = false
        }
        noteTime = performance.now() - recordStartTime + lingerOffset
      } else {
        noteTime = performance.now() - playOffset
        // noteTime = this.vuetimeline * 100
        // console.log('1', this.vuetimeline * 100)
        // console.log('2', performance.now() - recordStartTime + this.vuetimeline*100)
      }
      if (noteTime < 20000) {
        this.vuetimeline = 10 * noteTime / 1000
        this.recordPart.push({
          'note': noteId,
          'time': +(noteTime / 1000).toFixed(4)
        })
      } else {
        this.vuetimeline = 20 * 10 // 颗粒度是0.1s => 200份
        console.log('cannot record more than 20 seconds')
      }
    },
    handleNoteEnd(noteId) {
      piano.triggerRelease(noteId)
      this.$set(this.activeNote, noteId, 0)
    },
    touchNoteStartHandler(e) {
      console.log(e)
      //先存起来，防止在该键位touchmove重复
      touchIdKeyMap[e.changedTouches[0].identifier] = e.target.id // TODO: 猜测 touchstart只会有一个changetouches///
      this.handleNoteStart(e.target.id)
    },
    touchNoteEndHandler(e) {
      this.handleNoteEnd(e.target.id)
      this.handleNoteEnd(touchIdKeyMap[e.changedTouches[0].identifier]) // TODO: 猜测 touchend只会有一个changetouches,记录的正好是该停的
    },
    confirmRecordPart(shouldClearTime) {
      if (this.recordPart.length) {
        console.log('processing track: ', this.lastActivePartIndex)
        if (this.recordParts[this.lastActivePartIndex] && this.recordParts[this.lastActivePartIndex].length) {
          //已在该track录过,merge both
          this.recordPart = this.recordPart.concat(this.recordParts[this.lastActivePartIndex])
        }
        if (tonepart[this.lastActivePartIndex]) {
          try {
            tonepart[this.lastActivePartIndex].dispose() //覆盖之前的需要dispose
          } catch (e) {

          }
        }
        tonepart[this.lastActivePartIndex] = new Tone.Part(function(time, value) { //不能老这new啊，要每次一个数组，每次改动最后一个
          piano.triggerAttackRelease(value.note, "8n", time)
        }, this.recordPart).start(0)
        this.recordParts[this.lastActivePartIndex] = this.recordPart
        this.recordPart = []
        if (this.checkBouncibility()) {
          alert('cool')
        } else {
          alert('not cool')
        }
      } else {
        console.log('啥也没录')
      }
      this.lastActiveSwiperIndex = this.activeSwiperIndex
      // reinit time
      if (shouldClearTime) {
        this.vuetimeline = 0 // this is kind of separate for progress view
        recordStartTime = 0
      }
      isLinger = true
    },
    clearRecordPart(trackNum) {
      console.log(`cleaning track ${trackNum}`)
      if (this.activePartIndex === trackNum) {
        this.recordPart = []
      }
      if (this.recordParts[trackNum] && this.recordParts[trackNum].length) {
        this.$set(this.recordParts, trackNum, [])
        if (tonepart[trackNum]) {
          try {
            tonepart[trackNum].dispose() //dispose掉
          } catch (e) {

          }
          tonepart[trackNum] = undefined //同时要从数组中删掉
        }
      } else {
        console.log(`track ${trackNum} has no content`)
      }
    },
    checkBouncibility() {
      this.confirmRecordPart(0)
      bouncepart = []
      if (tonepart.length) {
        tonepart.forEach(item => {
          if (item && item._events.length && item._events[0].value) {
            item._events.forEach(noteInfo => {
              bouncepart.push(noteInfo.value)
            })
          }
        })
        bouncepart.sort((a, b) => (0 + a.time - b.time))
        return Magic.RealMagic(bouncepart)
      }
      return true;
    },
    bounceProject() {
      this.confirmRecordPart(0)
      console.log(this)
      console.log(tonepart)
      bouncepart = []
      if (tonepart.length) {
        tonepart.forEach(item => {
          if (item && item._events.length && item._events[0].value) {
            item._events.forEach(noteInfo => {
              bouncepart.push(noteInfo.value)
            })
          }
        })
        bouncepart.sort((a, b) => (0 + a.time - b.time))
        //TODO, semi done
        this.$store.dispatch('BOUNCE_PROJECT', {
          record: bouncepart,
          info: {
            title: 'default',
            content: 'default',
            cover: 'default'
          },
        }).then(id => {
          console.log('successfully bounced')
          alert('作品已为您存储')
          this.$router.push({
            path: '/new-music-box-viewer',
            query: {
              id
            }
          })
        }).catch((err) => {
          alert('failed to upload')
        })
        // while (tonepart.length) {
        //   tonepart.pop().dispose() //最后一个被dispose，同时要从数组中删掉
        // }
        // tonepart[0] = new Tone.Part(function(time, value) {
        //   piano.triggerAttackRelease(value.note, "8n", time)
        // }, bouncepart).start(0)
        // Magic.RealMagic(bouncepart)
      } else {
        alert('什么都没录呢')
      }
    },
    mapNoteTimeToColor(t) {
      return Magic.mapNoteTimeToColor(t)
    },
    mapNoteMidiToLength(m) {
      return Magic.mapNoteMidiToLength(m)
    },
    adjustTimeline(e) {
      if (this.playing) {
        console.log('ccccccccc')
        this.toggleReplay() //现在播放中拉条，直接停，涉及到ref读不到最新值貌似，无法直接继续播放 this is TODO
      } else {
        isLinger = true //你拉条了肯定是
      }
    },
    onMiniKeyboardScroll(e) {
      console.log(e.touches[0].clientY)
    },
    onMiniKeyboardStart(e) {
      console.log(e)
    },
    keng(e) {
      // console.log(e)
      // console.log(document.elementFromPoint(e.touches[0].clientX,e.touches[0].clientY).style.backgroundColor="yellow")
      console.log(e) //e.touches is array like object
      for (let i = 0; i <= e.changedTouches.length - 1; i++) {
        const a = document.elementFromPoint(e.changedTouches[i].clientX, e.changedTouches[i].clientY)
        if (a.classList.contains('white') || a.classList.contains('black')) {
          if (touchIdKeyMap[e.changedTouches[i].identifier] && touchIdKeyMap[e.changedTouches[i].identifier] != a.getAttribute('id')) { //这个touch已经触发，且和当前不一致
            console.log(touchIdKeyMap)
            this.handleNoteStart(a.getAttribute('id'))
            this.handleNoteEnd(touchIdKeyMap[e.changedTouches[i].identifier])
            touchIdKeyMap[e.changedTouches[i].identifier] = a.getAttribute('id')
          } else if (!touchIdKeyMap[e.changedTouches[i].identifier]) {
            console.log(2)
            this.handleNoteStart(a.getAttribute('id'))
            touchIdKeyMap[e.changedTouches[i].identifier] = a.getAttribute('id')
          } else {
            console.log(3)
            //新旧相同什么都不做
          }
        } else {
          console.log('外边')
          if (touchIdKeyMap[e.changedTouches[i].identifier]) {
            this.handleNoteEnd(touchIdKeyMap[e.changedTouches[i].identifier])
          }
          touchIdKeyMap[e.changedTouches[i].identifier] = undefined
        }
      }
    },
    btnStart(e) {
      console.log(e)
      extendBtnsTimeout = setTimeout(() => {
        //show extend buttons
        this.showExtendBtns = true;
      }, 500)

    },
    btnEnd(e) {
      // console.log(e)
      clearTimeout(extendBtnsTimeout)
      const a = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      console.log(a)
      if (a && a.classList.contains('bounceBtn')) {
        //导出
        this.bounceProject()
      } else if (a && (a.classList.contains('playBtn') || a.classList.contains('pauseBtn'))) {
        //播放
        this.toggleReplay()
      }
      this.showExtendBtns = false;
      //hide extend buttons
    }
  },
  created() {
    //check cookie to get serviceToken first
    // if stoken not exist, go auth
    const self = this
    Tone.Transport.cancel()
    // this is very important
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + 'px';
    this.PARTNUM = 3
    this.pianoRollSwiperOption = {
      initialSlide: this.PARTNUM,
      // centeredSlides: true,
      slidesPerView: 3,
      on: {
        // slideChange(e){
        //   console.log('1',e)
        // },
        // slideNextTransitionStart(e) {
        //   console.log('2',e)
        // },
        transitionEnd: function(e) {
          console.log('3', this.activeIndex) // THIS!!! within swiper...scope.....
          self.activeSwiperIndex = this.activeIndex
          self.confirmRecordPart(!isLinger)
        }
      }
    }
    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase())
    if (!inWechat) return
    // alert(Cookies.get('serviceToken'))
    WxShare.prepareShareConfig().then(()=>{
      WxShare.prepareShareContent({
        title:'MUSIXISE',
        desc:'寻找你自己的八音盒',
        fullPath:`${location.origin}${location.pathname}#/new-music-box-maker`,
        imgUrl:'http://oaeyej2ty.bkt.clouddn.com/Ocrg2srw_icon33@2x.png',
      })
    })
    if (Util.getUrlParam('code') || Cookies.get('serviceToken')) {
      //TODO:ajax call to get info
      Api.getUserInfo(Util.getUrlParam('code'))
        .then((res) => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove('serviceToken')
            location.replace(
              // will publish to node project m-musixise, under '/music-box' path
              // 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect'
              // `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
              `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(location.origin+location.pathname+'#/new-music-box-maker')}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
            )
          }
          alert(`welcome${res.data.data.realname}`)
          console.log('get user info success', res.data.data)
        })
        .catch((err) => {
          Cookies.remove('serviceToken')
          location.replace(
            // 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect'
            // `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
            `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(location.origin+location.pathname+'#/new-music-box-maker')}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
          )
        })
    } else { //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        // 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect'
        // `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(location.origin+location.pathname+'#/new-music-box-maker')}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
      )
    }
  },
  beforeRouteLeave (to, from, next) {
    Magic.clearTone(tonepart)
    next()
  },
  mounted() {
    // this.startRecord();
    // document.querySelector('#D5').addEventListener( "pointerenter", ()=>{
    //   console.log('jinru')
    // })

  },
  updated() {

  }
};
</script>

<template>
<div id="container">
  <!-- <v-touch @pan="onPan"> -->
  <div class="keys" @touchmove="keng" @touchstart.stop.prevent="touchNoteStartHandler" @touchend.stop.event="touchNoteEndHandler">
    <!-- using sharp sign => '#' as object key cause syntax error... -->
    <!-- <div :class="['white', 'a', activeNote.A3?'active-note':'']" id="A3"></div>
      <div :class="['black', 'b-minor', activeNote.Bb3?'active-note':'']" id="Bb3"></div>
      <div :class="['white', 'b', activeNote.B3?'active-note':'']" id="B3"></div> -->
    <div :class="['white', 'c', activeNote.C4?'active-note':'']" id="C4"></div>
    <div :class="['black', 'd-minor', activeNote.Db4?'active-note':'']" id="Db4"></div>
    <div :class="['white', 'd', activeNote.D4?'active-note':'']" id="D4"></div>
    <div :class="['black', 'e-minor', activeNote.Eb4?'active-note':'']" id="Eb4"></div>
    <div :class="['white', 'e', activeNote.E4?'active-note':'']" id="E4"></div>
    <div :class="['white', 'f', activeNote.F4?'active-note':'']" id="F4"></div>
    <div :class="['black', 'f-sharp', activeNote.Gb4?'active-note':'']" id="Gb4"></div>
    <div :class="['white', 'g', activeNote.G4?'active-note':'']" id="G4"></div>
    <div :class="['black', 'a-minor', activeNote.Ab4?'active-note':'']" id="Ab4"></div>
    <div :class="['white', 'a', activeNote.A4?'active-note':'']" id="A4"></div>
    <div :class="['black', 'b-minor', activeNote.Bb4?'active-note':'']" id="Bb4"></div>
    <div :class="['white', 'b', activeNote.B4?'active-note':'']" id="B4"></div>
    <div :class="['white', 'c', activeNote.C5?'active-note':'']" id="C5"></div>
    <div :class="['black', 'd-minor', activeNote.Db5?'active-note':'']" id="Db5"></div>
    <div :class="['white', 'd', activeNote.D5?'active-note':'']" id="D5"></div>
    <div :class="['black', 'e-minor', activeNote.Eb5?'active-note':'']" id="Eb5"></div>
    <div :class="['white', 'e', activeNote.E5?'active-note':'']" id="E5"></div>
    <div :class="['white', 'f', activeNote.F5?'active-note':'']" id="F5"></div>
    <div :class="['black', 'f-sharp', activeNote.Gb5?'active-note':'']" id="Gb5"></div>
    <div :class="['white', 'g', activeNote.G5?'active-note':'']" id="G5"></div>
    <div :class="['black', 'a-minor', activeNote.Ab5?'active-note':'']" id="Ab5"></div>
    <div :class="['white', 'a', activeNote.A5?'active-note':'']" id="A5"></div>
    <div :class="['black', 'b-minor', activeNote.Bb5?'active-note':'']" id="Bb5"></div>
    <div :class="['white', 'b', activeNote.B5?'active-note':'']" id="B5"></div>
    <div :class="['white', 'c', activeNote.C6?'active-note':'']" id="C6"></div>
    <div :class="['black', 'd-minor', activeNote.Db6?'active-note':'']" id="Db6"></div>
    <div :class="['white', 'd', activeNote.D6?'active-note':'']" id="D6"></div>
    <div :class="['black', 'e-minor', activeNote.Eb6?'active-note':'']" id="Eb6"></div>
    <div :class="['white', 'e', activeNote.E6?'active-note':'']" id="E6"></div>
    <div :class="['white', 'f', activeNote.F6?'active-note':'']" id="F6"></div>
  </div>
  <div class="keyshadow"></div>
  <div class="scroll-container"></div>
  <div class="semi-piano-roll" @touchmove.stop.prevent>
    <swiper :options="pianoRollSwiperOption" ref="pianoRoll">
      <!-- slides -->
      <swiper-slide v-for="n in PARTNUM">
        <div class="current-piano-roll">
          <svg :style="{height:'90%',padding:timelineConfig.dotSize/2+'px 0'}">

            <defs>


              	<filter id="glowing" height="400%" width="130%" x="-10%" y="-130%">
              		<!-- Thicken out the original shape -->
              		<feMorphology operator="dilate" radius="1" in="SourceAlpha" result="thicken" />

              		<!-- Use a gaussian blur to create the soft blurriness of the glow -->
              		<feGaussianBlur in="thicken" stdDeviation="2" result="blurred" />

              		<!-- Change the colour -->
              		<feFlood flood-color="rgb(200,200,255)" result="glowColor" />

              		<!-- Color in the glows -->
              		<feComposite in="glowColor" in2="blurred" operator="in" result="softGlow_colored" />

              		<!--	Layer the effects together -->
              		<feMerge>
              			<feMergeNode in="softGlow_colored"/>
              			<feMergeNode in="SourceGraphic"/>
              		</feMerge>

              	</filter>

              <!-- <filter id="glowing" x="0" y="0" width="200%" height="200%">
                <feOffset result="offOut" in="SourceGraphic" dx="0" dy="0" />
                <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
                <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
              </filter> -->
              <!-- <filter id="glowing">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                  </feMerge>
              </filter> -->
              <!-- <filter id="glowing">
                <feGaussianBlur id="blur" in="SourceAlpha" stdDeviation="1.5"/>
                <feColorMatrix id="recolor"  type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" result="white-glow"/>
                <feMerge>
                  <feMergeNode in="white-glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter> -->
            </defs>
            <rect v-if="activePartIndex===(PARTNUM-n)" v-for="(item,index) in recordPart"
              :x="2"
              :y="100*item.time/20 + '%'"
              :width="mapNoteMidiToLength(item.note)"
              height="3"
              rx="2"
              ry="2"
              :fill="mapNoteTimeToColor(item.time)"
              filter="url(#glowing)" />
            <rect v-for="(item,index) in recordParts[PARTNUM-n]"
              :x="2"
              :y="100*item.time/20 + '%'"
              :width="mapNoteMidiToLength(item.note)"
              height="3"
              rx="2"
              ry="2"
              :fill="activePartIndex===(PARTNUM-n)?mapNoteTimeToColor(item.time):'rgb(120,120,120)'"
              :filter="activePartIndex===(PARTNUM-n)?'url(#glowing)':''" />
          </svg>
          <div class="temp" @click="clearRecordPart(PARTNUM-n)"></div>
        </div>
      </swiper-slide>
      <!-- need the bottom two empty slides to fill whole swiper -->
      <swiper-slide></swiper-slide>
      <swiper-slide></swiper-slide>
    </swiper>
  </div>

  <div class="g-controller">
    <!-- <div class="timeline">
      <div class="progress">

      </div>
      <div class="indicator">

      </div>
    </div> -->
    <vue-slider v-model="vuetimeline" v-bind="timelineConfig" @callback="adjustTimeline" @drag-end=""></vue-slider>
    <div class="btnContainer" @touchstart.stop.prevent="btnStart" @touchend.stop.event="btnEnd">
      <div :class="[playing?'pauseBtn':'playBtn', 'rotate']" @click="toggleReplay">

      </div>
      <div :class="[showExtendBtns?'extendBtnsShow':'extendBtnsHide','extendBtns']">
        <div class='bounceBtn rotate'>

        </div>
      </div>
    </div>
  </div>

  <!-- </v-touch> -->
</div>
</template>

<style lang="scss" scoped>
@import '../_common/style/_functions.scss';
@import '../_common/style/_variables.scss';
@import '../_common/style/_mixins.scss';
@import '../_common/style/_reboot.scss';
.g-controller {
    position: fixed;
    width: getRem(42);
    height: 100%;
    padding-top: getRem(44);
    display: flex;
    flex-direction: column;
    align-items: center;
    right: 0.5rem;
    .timeline {
        height: 90%;
        width: getRem(16);
        background-color: rgb(110,113,158);
        .progress {
            height: 5%;
            background-color: rgb(69,106,255);
        }
        .indicator {
            position: relative;
            width: getRem(42);
            height: getRem(42);
            border-radius: getRem(21);
            border: 4px;
            border-color: yellow;
            background-color: #fff;
            right: getRem(13);
        }
    }
    .btnContainer {
        position: relative;
        width: getRem(84);
        height: getRem(84);
        margin-top: 0.3rem;
        .playBtn {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: getRem(42);
            background: url('../assets/play.svg') center center no-repeat;
            background-size: getRem(32);
            background-color: rgb(69,106,255);
        }
        .pauseBtn {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: getRem(42);
            background: url('../assets/pause.svg') center center no-repeat;
            background-size: getRem(32);
            background-color: rgb(69,106,255);
        }
        .bounceBtn {
            position: absolute;
            width: getRem(84);
            height: getRem(84);
            border-radius: getRem(42);
            background: url('../assets/check.svg') center center no-repeat;
            background-size: getRem(32);
        }
        .extendBtns {
            // this element is within rotate, everything is opposite
            position: absolute;
            height: getRem(84);
            border-radius: getRem(42);

            right: 0;
            z-index: -1;
            transition: width 2s;
            background: linear-gradient(to right, rgb(255,61,61),rgb(0,189,255),rgb(69,106,255) 80%);
        }
        .extendBtnsShow {
            width: getRem(300);
        }
        .extendBtnsHide {
            width: getRem(84);
        }
    }
}
.scroll-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    background: url('../assets/pianolid.png') no-repeat;
    background-size:getRem(46) 100%;
    // background-color:black;
    // transform: rotate(90deg);
    width: getRem(46);
    height: 100%;
    left: getRem(380);
}
.keyshadow {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  // background: url('../assets/pianolid.png') no-repeat;
  background: linear-gradient(to left, rgba(28,28,28,.92) 0%, rgba(48,48,48,.65) 10%,rgba(118,118,118,.1) 40%,rgba(0,0,0,0) 100%);
  pointer-events: none;
  // transform: rotate(90deg);
  width: getRem(388);
  height: 100%;
  width: getRem(388);
  left: 0;
}
.temp {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 0.35rem;
    margin: 0.5rem 0 0;
    background: url('../assets/delete.svg') center center no-repeat;
    background-size: getRem(32);
    background-color: #8e7aef;
}

#container {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: white;
}
h2 {
    font-size: 20px;
    color: #2c3e50;
}

* {
    user-select: none;
    margin: 0;
    padding: 0;
}

.container {
    width: 100%;
    height: 100%;
    position: absolute;
}

.keys {
    // position: absolute;  //make whole keys appear
    // 奇葩， adjust white and black heights influence all key layout
    height: 100%;
    position: fixed;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    float: left;
    /* padding-right:getRem(347); */
    box-sizing: border-box;
}
.semi-piano-roll {
    top: 0;
    width: getRem(328);
    position: fixed;
    right: 0;
    height: 100%;
    background-color: rgb(19,19,21);
    .swiper-container {
        height: 100%;
    }
    .current-piano-roll {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding-top: getRem(44);
        padding-left: getRem(18);
        svg {
            bottom: getRem(92);
            height: 100%;
            width: 100%;
        }
    }
}

.general-controller {
    display: flex;
    width: 2.5rem;
    position: fixed;
    right: 0;
    height: 100%;
    background: linear-gradient(90deg, rgba(40,40,40,.5) 0%, rgba(40,40,40,.8) 100%);
    .funcBtn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: getRem(100);
        height: getRem(220);
        border-radius: getRem(10);
        box-sizing: border-box;
        &.record {
            background-color: #b70411;
            .recordHint {
                width: getRem(50);
                height: getRem(50);
                background-color: white;
                border-radius: 50%;
            }
            &.active {
                background-color: red;
                border: 1px solid white;
            }
        }
        &.play {
            background-color: #098244;
            .playHint {
                width: getRem(50);
                height: getRem(50);
                background: url('../assets/play.svg') center center;
                background-size: cover;
            }
            .stopHint {
                width: getRem(45);
                height: getRem(45);
                background-color: white;
                border-radius: 10%;
            }
            &.active {
                background-color: #0aca0a;
                border: 1px solid white;
            }
        }
        &.undo {
            background-color: #a4af00;
            .undoHint {
                width: getRem(50);
                height: getRem(50);
                background: url('../assets/undo.svg') center center;
                background-size: cover;
            }
            &:active {
                background-color: #e3f300;
                // border: 1px solid white;
            }
        }
        &.bounce {
            background-color: black;
            .bounceHint {
                width: getRem(50);
                height: getRem(50);
                background: url('../assets/bounce.svg') center center;
                background-size: cover;
            }
            &.active {
                background-color: green;
                border: 1px solid white;
            }
        }
    }
}
.general-controller-enter-active,
.general-controller-leave-active {
    transition: all 0.5s ease;
}
.general-controller-enter,
.general-controller-leave-to {
    transform: translateX(3.5rem);
}

.progressBar {
    position: fixed;
    width: getRem(750);
}

/* piano keyboard layout css  */

.white {
    width: getRem(388);
    height: 5.56%;
    z-index: 1;
    // border-left: 1px solid #bbb;
    // border-bottom: 1px solid #bbb;
    // border-radius: 0 0 5px 5px;
    // box-shadow: 1px 0 0 rgba(80, 80, 80, 0.8) inset, 0 0 5px #ccc inset, 0 0 3px rgba(0, 0, 0, 0.2);
    box-shadow: 0 0 1px rgba(65, 65, 65, 0.5) inset, 0 0 2px rgba(211, 211, 211, 0.5) inset;
    // background: linear-gradient(to left, rgba(28,28,28,.92) 0%, rgba(48,48,48,.65) 10%,rgba(118,118,118,.1) 40%,rgba(0,0,0,0) 100%);
    background-color:white;
    &.active-note {
        box-shadow: 2px 0 3px rgba(0, 0, 0, 0.1) inset, -5px 5px 20px rgba(0, 0, 0, 0.2) inset, 0 0 3px rgba(0, 0, 0, 0.2);
        // background: linear-gradient(to left, #555 0%, #ddd 40%, #eee 100%);
        background:linear-gradient(to left, white,rgb(236,236,236));
    }
}

.black {
    position: relative;
    width: getRem(200);
    height: getRem(50);
    margin-top: getRem(-50);
    top: getRem(25);
    // height: 4.3%; 百分比不好使
    // margin-top: -4.3%;
    // top: 2.15%;
    z-index: 2;
    border: 2px solid #000;
    border-radius: getRem(8) 0px 0px getRem(8);
    // box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset, 0 -5px 2px 3px rgba(0, 0, 0, 0.6) inset, 0 2px 4px rgba(0, 0, 0, 0.5);
    // background: linear-gradient(45deg, #222 0%, #555 100%);
    background:url('../assets/blackkey.png') center center no-repeat;
    background-size:cover;
    &.active-note {
        // box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset, 0 -2px 2px 3px rgba(0, 0, 0, 0.6) inset, 0 1px 2px rgba(0, 0, 0, 0.5);
        // background: linear-gradient(to right, #444 0%, #222 100%);
        background:url('../assets/blackkeydown.png') center center no-repeat;
        background-size:cover;
    }
}

/* mask layout */

.mask {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mask #timer {
    color: white;
    font-size: xx-large;
    font-style: italic;
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

.hide {
    display: none;
}

.rotate {
    transform: rotate(90deg);
}
</style>
