<script>
import "swiper/dist/css/swiper.css";
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
import * as WxShare from "../_common/js/wx_share";
import vueSlider from "vue-slider-component";
import { swiper, swiperSlide } from "vue-awesome-swiper";

const Tone = require("tone");
const touchIdKeyMap = {}; // touch move can have several threads, each thread only activate one note at most
// e.g. {0:a4,1:b5}

const MINI_KEY_LENGTH = 200; // px
let extendBtnsTimeout;

let piano = new Tone.Sampler(
  {
    C4: "C4.[mp3|ogg]",
    "D#4": "Ds4.[mp3|ogg]",
    "F#4": "Fs4.[mp3|ogg]",
    A4: "A4.[mp3|ogg]",
    C5: "C5.[mp3|ogg]",
    "D#5": "Ds5.[mp3|ogg]",
    "F#5": "Fs5.[mp3|ogg]",
    A5: "A5.[mp3|ogg]",
    C6: "C6.[mp3|ogg]"
  },
  {
    release: 1,
    // 'baseUrl': '/static/audio/'
    baseUrl: "//cnbj1.fds.api.xiaomi.com/mbox/audio/"
  }
).toMaster();

// var plucky = new Tone.PluckSynth().toMaster()

const SCREEN_WIDTH = document.documentElement.getBoundingClientRect().width;
const SCREEN_HEIGHT = Math.max(
  document.documentElement.clientHeight,
  window.innerHeight || 0
);

let tonepart = []; // store all the music parts. (ummm,that's why it's named part...)
let bouncepart = [];

let recordStartTime = 0;

let isLinger = true; // 非播放状态中未开始录音
let replayInterval; // 控制progressbar的setinterval
let playOffset = 0; // 播放状态的拉条bar初始时间记录
let lingerOffset = 0; // 未播放状态的拉条bar初始时间记录
const PROGRESS_INTERVAL_TIME = 0.1; // 0.1秒挪一下
let tutorOnceEnter = false;
let tutorTimeout = [];
export default {
  components: {
    swiper,
    swiperSlide,
    vueSlider
  },
  props: ["screenOrientation"],
  data() {
    return {
      portraitMode: true,
      activeNote: {},
      recordPart: [], // current record part
      recordParts: [], // each new record goes in here.
      playing: false,
      generalControllerShow: false,
      activeSwiperIndex: 3,
      lastActiveSwiperIndex: 3 - 1,
      vuetimeline: 0,
      showExtendBtns: false,
      alertAppear: false,
      bouncing: false,
      tutorSession: 0,
      handClass: "", // hand or clickhand
      tutorClass: "", // hand positioning in different session
      timelineConfig: {
        value: 0,
        width: 8,
        // height: `${window.screen.height*0.9-20}px`,
        height: "90%",
        padding: "0",
        dotSize: 20,
        eventType: "auto",
        min: 0,
        max: 200,
        interval: 1,
        disabled: false,
        show: true,
        tooltip: "always",
        // tooltip: 'hidden',
        piecewise: false,
        reverse: true,
        style: {
          display: "inline-block"
        },
        class: "star-slider",
        direction: "vertical",
        speed: PROGRESS_INTERVAL_TIME,
        bgStyle: {
          backgroundColor: "rgb(110,113,158)",
          boxShadow: "inset 0.5px 0.5px 3px 1px rgba(0,0,0,.36)"
        },
        tooltipDir: "left",
        tooltipStyle: {
          backgroundColor: "rgb(69, 106, 255)",
          borderColor: "rgb(69, 106, 255)",
          transform: "rotate(90deg)",
          transformOrigin: "right",
          position: "relative",
          left: "-.2rem",
          top: "0.9rem"
        },
        formatter(value) {
          if (value) {
            return `${(value / 10).toFixed(1)}s/20s`;
          }
          return "0.0s/20s";
        },
        processStyle: {
          backgroundColor: "rgb(69,106,255)"
        }
      }
    };
  },
  watch: {
    playing(val) {
      console.log("playing status", val);
      if (val) {
        //start progress bar
        replayInterval = setInterval(() => {
          this.vuetimeline += 1;
          if (this.vuetimeline >= 200) {
            this.toggleReplay();
            this.vuetimeline = 0;
          }
        }, PROGRESS_INTERVAL_TIME * 1000);
      } else {
        //stop progress bar
        clearInterval(replayInterval);
      }
    },
    screenOrientation() {
      console.log("update");
      this.$nextTick(() => this.$refs.timeline.refresh());
    }
  },
  computed: {
    swiper() {
      return this.$refs.pianoRoll.swiper;
    },
    activePartIndex() {
      return this.PARTNUM - this.activeSwiperIndex - 1;
    },
    lastActivePartIndex() {
      return this.PARTNUM - this.lastActiveSwiperIndex - 1;
    }
  },
  methods: {
    load() {},
    toggleReplay() {
      console.log(1);
      this.playing = !this.playing;
      if (this.playing) {
        if (this.vuetimeline >= 200) {
          this.vuetimeline = 0;
        }
        // this.confirmRecordPart(!isLinger)
        playOffset = performance.now() - this.vuetimeline * 100;
        console.log("播放开始");
        this.confirmRecordPart(0);
        console.log("kokokoko");
        recordStartTime = performance.now();
        console.log(`activeOffsetTime${this.vuetimeline * 100}`);
        Tone.Transport.start("+0.01", (this.vuetimeline * 100) / 1000); // TODO:有问题in case < context.currentTime
      } else {
        console.log("播放停了");
        Tone.Transport.stop(0); // TODO：必须stop才能start。。。有没有自动stop啊..
        // recordStartTime = performance.now()
      }
    },
    handleNoteStart(noteId) {
      let noteTime = 0;
      // console.log('down', e.target.id)
      piano.triggerAttack(noteId);
      // console.log('midi no. :', Tone.Frequency(noteId).toMidi())
      this.$set(this.activeNote, noteId, 1);
      if (!this.playing) {
        if (isLinger) {
          recordStartTime = performance.now();
          lingerOffset = this.vuetimeline * 100;
          isLinger = false;
        }
        noteTime = performance.now() - recordStartTime + lingerOffset;
      } else {
        noteTime = performance.now() - playOffset;
        // noteTime = this.vuetimeline * 100
        // console.log('1', this.vuetimeline * 100)
        // console.log('2', performance.now() - recordStartTime + this.vuetimeline*100)
      }
      if (noteTime < 20000) {
        this.vuetimeline = (10 * noteTime) / 1000;
        this.recordPart.push({
          note: noteId,
          time: +(noteTime / 1000).toFixed(4)
        });
      } else {
        this.vuetimeline = 20 * 10; // 颗粒度是0.1s => 200份
        console.log("cannot record more than 20 seconds");
      }
    },
    handleNoteEnd(noteId) {
      piano.triggerRelease(noteId);
      this.$set(this.activeNote, noteId, 0);
    },
    touchNoteStartHandler(e) {
      console.log(e);
      // 先存起来，防止在该键位touchmove重复
      touchIdKeyMap[e.changedTouches[0].identifier] = e.target.id; // TODO: 猜测 touchstart只会有一个changetouches///
      this.handleNoteStart(e.target.id);
    },
    touchNoteEndHandler(e) {
      this.handleNoteEnd(e.target.id);
      this.handleNoteEnd(touchIdKeyMap[e.changedTouches[0].identifier]); // TODO: 猜测 touchend只会有一个changetouches,记录的正好是该停的
    },
    confirmRecordPart(shouldClearTime) {
      if (this.recordPart.length) {
        console.log("processing track: ", this.lastActivePartIndex);
        if (
          this.recordParts[this.lastActivePartIndex] &&
          this.recordParts[this.lastActivePartIndex].length
        ) {
          // 已在该track录过,merge both
          this.recordPart = this.recordPart.concat(
            this.recordParts[this.lastActivePartIndex]
          );
        }
        if (tonepart[this.lastActivePartIndex]) {
          try {
            tonepart[this.lastActivePartIndex].dispose(); // 覆盖之前的需要dispose
          } catch (e) {}
        }
        tonepart[this.lastActivePartIndex] = new Tone.Part((time, value) => {
          // 不能老这new啊，要每次一个数组，每次改动最后一个
          piano.triggerAttackRelease(value.note, "8n", time);
        }, this.recordPart).start(0);
        this.recordParts[this.lastActivePartIndex] = this.recordPart;
        this.recordPart = [];
      } else {
        console.log("啥也没录");
      }
      this.lastActiveSwiperIndex = this.activeSwiperIndex;
      // reinit time
      if (shouldClearTime) {
        this.vuetimeline = 0; // this is kind of separate for progress view
        recordStartTime = 0;
      }
      isLinger = true;
    },
    clearRecordPart(trackNum) {
      console.log(`cleaning track ${trackNum}`);
      if (this.activePartIndex === trackNum) {
        this.recordPart = [];
        this.vuetimeline = 0;
        isLinger = true;
        this.playing = false;
        Tone.Transport.stop(0);
      }
      if (this.recordParts[trackNum] && this.recordParts[trackNum].length) {
        this.$set(this.recordParts, trackNum, []);
        if (tonepart[trackNum]) {
          try {
            tonepart[trackNum].dispose(); // dispose掉
          } catch (e) {}
          tonepart[trackNum] = undefined; // 同时要从数组中删掉
        }
      } else {
        console.log(`track ${trackNum} has no content`);
      }
    },
    checkBouncibility() {
      this.confirmRecordPart(0);
      bouncepart = [];
      if (tonepart.length) {
        tonepart.forEach(item => {
          if (item && item._events.length && item._events[0].value) {
            item._events.forEach(noteInfo => {
              bouncepart.push(noteInfo.value);
            });
          }
        });
        bouncepart.sort((a, b) => 0 + a.time - b.time);
        return Magic.RealMagic(bouncepart);
      }
      return true;
    },
    bounceProject() {
      this.confirmRecordPart(0);
      console.log(this);
      console.log(tonepart);
      bouncepart = [];
      if (tonepart.length) {
        tonepart.forEach(item => {
          if (item && item._events.length && item._events[0].value) {
            item._events.forEach(noteInfo => {
              bouncepart.push(noteInfo.value);
            });
          }
        });
        bouncepart.sort((a, b) => 0 + a.time - b.time);
        // TODO, semi done
        this.bouncing = true;
        this.$store
          .dispatch("BOUNCE_PROJECT", {
            record: bouncepart,
            info: {
              title: "尚未起名",
              content: "default",
              cover: ""
            }
          })
          .then(id => {
            console.log("successfully bounced");
            this.bouncing = false;
            this.$toast("作品已为您存储");
            this.$router.push({
              path: "/new-music-box-viewer",
              query: {
                id
              }
            });
          })
          .catch(err => {
            this.bouncing = false;
            this.$toast("非常抱歉，上传作品失败了");
          });
      } else {
        this.$toast("什么都没录呢");
      }
    },
    mapNoteTimeToColor(t) {
      return Magic.mapNoteTimeToColor(t);
    },
    mapNoteMidiToLength(m) {
      return Magic.mapNoteMidiToLength(m);
    },
    adjustTimeline(e) {
      if (this.playing) {
        console.log("ccccccccc");
        this.toggleReplay(); // 现在播放中拉条，直接停，涉及到ref读不到最新值貌似，无法直接继续播放 this is TODO
      } else {
        isLinger = true; // 你拉条了肯定是
      }
    },
    onMiniKeyboardScroll(e) {
      console.log(e.touches[0].clientY);
    },
    onMiniKeyboardStart(e) {
      console.log(e);
    },
    keng(e) {
      // console.log(e)
      // console.log(document.elementFromPoint(e.touches[0].clientX,e.touches[0].clientY).style.backgroundColor="yellow")
      console.log(e); // e.touches is array like object
      for (let i = 0; i <= e.changedTouches.length - 1; i++) {
        const a = document.elementFromPoint(
          e.changedTouches[i].clientX,
          e.changedTouches[i].clientY
        );
        if (a.classList.contains("white") || a.classList.contains("black")) {
          if (
            touchIdKeyMap[e.changedTouches[i].identifier] &&
            touchIdKeyMap[e.changedTouches[i].identifier] !=
              a.getAttribute("id")
          ) {
            // 这个touch已经触发，且和当前不一致
            console.log(touchIdKeyMap);
            this.handleNoteStart(a.getAttribute("id"));
            this.handleNoteEnd(touchIdKeyMap[e.changedTouches[i].identifier]);
            touchIdKeyMap[e.changedTouches[i].identifier] = a.getAttribute(
              "id"
            );
          } else if (!touchIdKeyMap[e.changedTouches[i].identifier]) {
            console.log(2);
            this.handleNoteStart(a.getAttribute("id"));
            touchIdKeyMap[e.changedTouches[i].identifier] = a.getAttribute(
              "id"
            );
          } else {
            console.log(3);
            // 新旧相同什么都不做
          }
        } else {
          console.log("外边");
          if (touchIdKeyMap[e.changedTouches[i].identifier]) {
            this.handleNoteEnd(touchIdKeyMap[e.changedTouches[i].identifier]);
          }
          touchIdKeyMap[e.changedTouches[i].identifier] = undefined;
        }
      }
    },
    btnStart(e) {
      console.log(e);
      extendBtnsTimeout = setTimeout(() => {
        // show extend buttons
        this.showExtendBtns = true;
      }, 200);
    },
    btnEnd(e) {
      // console.log(e)
      clearTimeout(extendBtnsTimeout);
      const a = document.elementFromPoint(
        e.changedTouches[0].clientX,
        e.changedTouches[0].clientY
      );
      console.log(a);
      if (a && a.classList.contains("bounceBtn")) {
        // 导出
        if (this.checkBouncibility()) {
          this.bounceProject();
        } else {
          this.alertAppear = true;
        }
      } else if (
        a &&
        (a.classList.contains("playBtn") || a.classList.contains("pauseBtn"))
      ) {
        // 播放
        this.toggleReplay();
        this.showExtendBtns = false;
      } else if (
        a &&
        (a.classList.contains("playBtn") || a.classList.contains("cancelBtn"))
      ) {
        // hide extend buttons
        this.showExtendBtns = false;
      }
    },
    tutorStart() {
      // 0未开始，1黑屏,2键盘，3track，4时间线，5播放,
      this.tutorSession = 1;
      this.$toast("请锁住竖屏使用");
      tutorOnceEnter = setTimeout(this.tutorProgress, 3000);
      // setTimeout(()=>{this.tutorSession=2},3000)
      // setTimeout(()=>{this.tutorSession=3;this.swiper.slidePrev()},5000)
      // setTimeout(()=>{this.swiper.slideNext()},7000)
      // setTimeout(()=>{this.tutorSession=4},8500)
      // setTimeout(()=>{this.vuetimeline=120},9500)
      // setTimeout(()=>{this.vuetimeline=0},10500)
      // setTimeout(()=>{this.tutorSession=5},12000)
      // setTimeout(()=>{this.showExtendBtns = true},13000)
      // setTimeout(()=>{this.showExtendBtns=false},15000)
      // setTimeout(()=>{this.tutorSession=0},16000)
    },
    tutorProgress() {
      clearTimeout(tutorOnceEnter);
      console.log("??????????");
      this.tutorSession += 1;
      console.log(this.tutorSession);
      switch (this.tutorSession) {
        case 1:
          this.clearTutorTimeout();
          this.$toast("请锁住竖屏使用,长按播放按钮保存作品");
          break;
        case 2:
          this.clearTutorTimeout();
          this.handClass = "hand"; // clickhand
          this.tutorClass = "tutor2start";
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "clickhand"; // clickhand
              this.tutorClass = "tutor2end";
            }, 500)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.vuetimeline = 120;
              this.handClass = "hand";
            }, 1500)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.vuetimeline = 0;
              this.handClass = "hidehand";
            }, 2500)
          );
          break;
        case 3:
          this.clearTutorTimeout();
          this.handClass = "hand"; // clickhand
          this.tutorClass = "tutor3start";
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "clickhand"; // clickhand
              this.tutorClass = "tutor3end";
            }, 500)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "hand"; // clickhand
              this.tutorClass = "tutor3end";
            }, 800)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "hidehand";
            }, 1000)
          );
          break;
        case 4:
          this.clearTutorTimeout();
          this.handClass = "hand"; // clickhand
          this.tutorClass = "tutor4start";
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "clickhand"; // clickhand
              this.tutorClass = "tutor4end";
            }, 500)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "hand"; // clickhand
              this.tutorClass = "tutor4start";
              this.showExtendBtns = true;
            }, 1500)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "hidehand";
            }, 2500)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.showExtendBtns = false;
            }, 3000)
          );
          break;
        case 5:
          this.clearTutorTimeout();
          this.handClass = "hand"; // clickhand
          this.tutorClass = "tutor5start";
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "clickhand"; // clickhand
              this.tutorClass = "tutor5end";
            }, 1200)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.swiper.slidePrev();
            }, 1500)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.swiper.slideNext();
              this.handClass = "hidehand";
            }, 2500)
          );
          break;
        case 6:
          this.clearTutorTimeout();
          this.handClass = "hand"; // clickhand
          this.tutorClass = "tutor6start";
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "clickhand"; // clickhand
              this.tutorClass = "tutor6end";
            }, 500)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "hand"; // clickhand
              this.tutorClass = "tutor6end";
            }, 800)
          );
          tutorTimeout.push(
            setTimeout(() => {
              this.handClass = "hidehand";
            }, 1500)
          );
          break;
        default:
          this.tutorSession = 0;
          break;
      }
    },
    clearTutorTimeout() {
      this.showExtendBtns = false;
      tutorTimeout.forEach(v => clearTimeout(v));
      tutorTimeout = [];
    }
  },
  created() {
    // check cookie to get serviceToken first
    // if stoken not exist, go auth

    const self = this;
    Tone.Transport.cancel();
    tonepart = [];
    bouncepart = [];
    // this is very important
    let docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = `${window.rem}px`;

    this.PARTNUM = 3;
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
        transitionEnd(e) {
          console.log("3", this.activeIndex); // THIS!!! within swiper...scope.....
          self.activeSwiperIndex = this.activeIndex;
          self.confirmRecordPart(!isLinger);
        }
      }
    };
    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) return;
    // alert(Cookies.get('serviceToken'))
    WxShare.prepareShareConfig().then(() => {
      WxShare.prepareShareContent({
        title: "MUSIXISE",
        desc: "寻找你自己的八音盒",
        fullPath: `${location.origin}${location.pathname}#/new-music-box-maker`,
        imgUrl: "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
      });
    });
    if (Util.getUrlParam("code") || Cookies.get("serviceToken")) {
      // TODO:ajax call to get info
      Api.getUserInfo(Util.getUrlParam("code"))
        .then(res => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove("serviceToken");
            location.replace(
              // will publish to node project m-musixise, under '/music-box' path
              // 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect'
              // `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
              `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
                `${location.origin + location.pathname}#/new-music-box-maker`
              )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
            );
          }
          // alert(`welcome${res.data.data.realname}`)
          console.log("get user info success", res.data.data);
        })
        .catch(err => {
          Cookies.remove("serviceToken");
          location.replace(
            // 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect'
            // `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
            `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
              `${location.origin + location.pathname}#/new-music-box-maker`
            )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
          );
        });
    } else {
      // 又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        // 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect'
        // `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
          `${location.origin + location.pathname}#/new-music-box-maker`
        )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
      );
    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone(tonepart);
    next();
  },
  mounted() {
    // this.startRecord();
    // pointer events以后可以使用
    this.tutorStart();
  },
  updated() {}
};
</script>

<template>
  <div id="container">
    <!-- <v-touch @pan="onPan"> -->
    <div
      :class="['keys',tutorSession===8?'tutorial-highlight':'']"
      @touchmove="keng"
      @touchstart.stop.prevent="touchNoteStartHandler"
      @touchend.stop.event="touchNoteEndHandler"
    >
      <!-- using sharp sign => '#' as object key cause syntax error... -->
      <!-- <div :class="['white', 'a', activeNote.A3?'active-note':'']" id="A3"></div>
      <div :class="['black', 'b-minor', activeNote.Bb3?'active-note':'']" id="Bb3"></div>
      <div :class="['white', 'b', activeNote.B3?'active-note':'']" id="B3"></div>-->
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
    <div :class="['keyshadow',tutorSession===8?'tutorial-highlight':'']"></div>
    <div class="scroll-container"></div>
    <div
      class="semi-piano-roll"
      :class="[(tutorSession===5||tutorSession===6)?'tutorial-highlight':'']"
      @touchmove.stop.prevent
    >
      <swiper :options="pianoRollSwiperOption" ref="pianoRoll">
        <!-- slides -->
        <swiper-slide v-for="n in PARTNUM">
          <div class="current-piano-roll">
            <svg :style="{height:'90%',padding:timelineConfig.dotSize/2+'px 0'}">
              <defs>
                <filter id="glowing" height="400%" width="130%" x="-10%" y="-130%">
                  <!-- Thicken out the original shape -->
                  <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="thicken"></feMorphology>

                  <!-- Use a gaussian blur to create the soft blurriness of the glow -->
                  <feGaussianBlur in="thicken" stdDeviation="2" result="blurred"></feGaussianBlur>

                  <!-- Change the colour -->
                  <feFlood flood-color="rgb(200,200,255)" result="glowColor"></feFlood>

                  <!-- Color in the glows -->
                  <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow_colored"></feComposite>

                  <!--	Layer the effects together -->
                  <feMerge>
                    <feMergeNode in="softGlow_colored"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                  </feMerge>
                </filter>
              </defs>
              <rect
                v-if="activePartIndex===(PARTNUM-n)"
                v-for="(item,index) in recordPart"
                :x="2"
                :y="100*item.time/20 + '%'"
                :width="mapNoteMidiToLength(item.note)"
                height="3"
                rx="2"
                ry="2"
                :fill="mapNoteTimeToColor(item.time)"
                filter="url(#glowing)"
              ></rect>
              <rect
                v-for="(item,index) in recordParts[PARTNUM-n]"
                :x="2"
                :y="100*item.time/20 + '%'"
                :width="mapNoteMidiToLength(item.note)"
                height="3"
                rx="2"
                ry="2"
                :fill="activePartIndex===(PARTNUM-n)?mapNoteTimeToColor(item.time):'rgb(120,120,120)'"
                :filter="activePartIndex===(PARTNUM-n)?'url(#glowing)':''"
              ></rect>
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
      <vue-slider
        ref="timeline"
        :class="[tutorSession===2?'tutorial-highlight':'']"
        :show="screenOrientation==='portrait'"
        v-model="vuetimeline"
        v-bind="timelineConfig"
        @callback="adjustTimeline"
        @drag-end
      ></vue-slider>
      <div
        class="btnContainer"
        :class="[(tutorSession===3||tutorSession===4)?'tutorial-highlight':'']"
        @touchstart.stop.prevent="btnStart"
        @touchend.stop.event="btnEnd"
      >
        <div :class="[playing?'pauseBtn':'playBtn', 'rotate']" @click="toggleReplay"></div>
        <div :class="[showExtendBtns?'extendBtnsShow':'extendBtnsHide','extendBtns']">
          <div class="bounceBtn rotate"></div>
          <div class="cancelBtn"></div>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div id="alert-mask" v-show="alertAppear">
        <div class="mb-dialog">
          <div class="title">减少些音符才能做成音乐盒，是否继续上传</div>
          <div class="btns">
            <span class="btn cancel" @click="alertAppear=false">再调整</span>
            <span class="btn confirm" @click="bounceProject">任性上传</span>
          </div>
        </div>
      </div>
    </transition>
    <!-- </v-touch> -->
    <div class="mask" v-show="bouncing">
      <p>存储中...</p>
    </div>
    <div class="hint-mask" id="tutorial-mask" v-show="tutorSession>0" @touchend="tutorProgress">
      <!-- <transition name="tutor1"><div></div></transition> -->
      <div v-show="tutorSession===2" class="hint-text" id="timeline-hint">
        <h3>进度条</h3>
        <p>拖动原点改变时间</p>
      </div>
      <div v-show="tutorSession===3" class="hint-text" id="play-hint">
        <h3>功能按钮</h3>
        <p>点击播放/暂停</p>
      </div>
      <div v-show="tutorSession===4" class="hint-text" id="longpress-hint">
        <h3>功能按钮</h3>
        <p>长按后点击：保存/取消</p>
      </div>
      <div v-show="tutorSession===5" class="hint-text" id="swipe-hint">
        <h3>多轨编曲</h3>
        <p>上下滑动切换轨道编曲</p>
      </div>
      <div v-show="tutorSession===6" class="hint-text" id="clear-hint">
        <h3>多轨编曲</h3>
        <p>清空轨道</p>
      </div>
    </div>
    <div id="tutorhand" :class="[tutorClass]" v-show="handClass!='hidehand'">
      <div :class="[handClass]"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
#tutorhand {
  position: absolute;
  width: getRem(96);
  height: getRem(98);
  // transform:rotate(90deg);
  // background-color:white;
  z-index: 500;
  transition: background 0.05s ease, transform 1s linear;
  &.tutor2start {
    top: 0.5rem;
    right: 0.8rem;
    transition: none;
  }
  &.tutor2end {
    top: 0.5rem;
    right: 0.8rem;
    transform: translateY(5rem);
  }
  &.tutor3start {
    bottom: 0.1rem;
    right: 0.6rem;
    transition: none;
  }
  &.tutor3end {
    bottom: 0.1rem;
    right: 0.6rem;
  }
  &.tutor4start {
    bottom: 0.1rem;
    right: 0.6rem;
    transition: none;
  }
  &.tutor4end {
    bottom: 0.1rem;
    right: 0.6rem;
  }
  &.tutor5start {
    top: 2rem;
    right: 3.5rem;
    transition: none;
  }
  &.tutor5end {
    top: 2rem;
    right: 3.5rem;
    transform: translateX(1rem);
  }
  &.tutor6start {
    bottom: 0.1rem;
    right: 3.5rem;
    transition: none;
  }
  &.tutor6end {
    bottom: 0.1rem;
    right: 3.5rem;
  }
}
// .longclickhand {transform:rotate(90deg) translateY(1rem);background:url('../assets/tutorial/handlongclick.svg') no-repeat;background-size:contain}
.hand {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(90deg);
  background: url("../assets/tutorial/hand.svg") no-repeat;
  background-size: contain;
}
.clickhand {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(90deg);
  background: url("../assets/tutorial/handclick.svg") no-repeat;
  background-size: contain;
}
#tutorial-mask {
  .hint-text {
    color: white;
    text-align: right;
  }
}
.tutorial-highlight {
  z-index: 200;
  pointer-events: none;
}
.g-controller {
  position: absolute;
  width: getRem(42);
  height: 100%;
  padding-top: getRem(44);
  display: flex;
  flex-direction: column;
  align-items: center;
  right: 0.5rem;
  // pointer-events: none;
  // .timeline {
  //     height: 90%;
  //     width: getRem(16);
  //     background-color: rgb(110,113,158);
  //     .progress {
  //         height: 5%;
  //         background-color: rgb(69,106,255);
  //     }
  //     .indicator {
  //         position: relative;
  //         width: getRem(42);
  //         height: getRem(42);
  //         border-radius: getRem(21);
  //         border: 4px;
  //         border-color: yellow;
  //         background-color: #fff;
  //         right: getRem(13);
  //     }
  // }
  .btnContainer {
    position: relative;
    width: getRem(84);
    height: getRem(84);
    margin-top: 0.3rem;
    .playBtn {
      z-index: 2;
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: getRem(42);
      background: url("../assets/play.svg") center center no-repeat;
      background-size: getRem(32);
      background-color: rgb(69, 106, 255);
    }
    .pauseBtn {
      z-index: 2;
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: getRem(42);
      background: url("../assets/pause.svg") center center no-repeat;
      background-size: getRem(32);
      background-color: rgb(69, 106, 255);
    }
    .bounceBtn {
      position: absolute;
      width: getRem(84);
      height: getRem(84);
      border-radius: getRem(42);
      left: getRem(310);
      background: url("../assets/check.svg") center center no-repeat;
      // background-size: getRem(32);
    }
    .cancelBtn {
      position: absolute;
      width: getRem(84);
      height: getRem(84);
      border-radius: getRem(42);
      background: url("../assets/cancel.svg") center center no-repeat;
      // background-size: getRem(32);
    }
    .extendBtns {
      // this element is within rotate, everything is opposite
      position: absolute;
      height: getRem(84);
      border-radius: getRem(42);
      overflow: hidden;
      right: -1px;
      z-index: 1;
      transition: width 1s;
      background: linear-gradient(
        to right,
        rgb(254, 64, 64),
        rgb(142, 122, 239),
        rgb(69, 106, 255) 80%
      );
    }
    .extendBtnsShow {
      width: getRem(690);
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
  background: url("../assets/pianolid.png") no-repeat;
  background-size: getRem(46) 100%;
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
  background: linear-gradient(
    to left,
    rgba(28, 28, 28, 0.92) 0%,
    rgba(48, 48, 48, 0.65) 10%,
    rgba(118, 118, 118, 0.1) 40%,
    rgba(0, 0, 0, 0) 100%
  );
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
  background: url("../assets/delete.svg") center center no-repeat;
  background-size: getRem(32);
  background-color: #8e7aef;
}

#container {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: rgb(19, 19, 21);
}
h2 {
  font-size: 20px;
  color: #2c3e50;
}

// * {
//   user-select: none;
//   margin: 0;
//   padding: 0;
// }

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
  // background-color: rgb(19,19,21);
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
  background: linear-gradient(
    90deg,
    rgba(40, 40, 40, 0.5) 0%,
    rgba(40, 40, 40, 0.8) 100%
  );
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
        background: url("../assets/play.svg") center center;
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
        background: url("../assets/undo.svg") center center;
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
        background: url("../assets/bounce.svg") center center;
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
  box-shadow: 0 0 1px rgba(65, 65, 65, 0.5) inset,
    0 0 2px rgba(211, 211, 211, 0.5) inset;
  // background: linear-gradient(to left, rgba(28,28,28,.92) 0%, rgba(48,48,48,.65) 10%,rgba(118,118,118,.1) 40%,rgba(0,0,0,0) 100%);
  background-color: white;
  &.active-note {
    box-shadow: 2px 0 3px rgba(0, 0, 0, 0.1) inset,
      -5px 5px 20px rgba(0, 0, 0, 0.2) inset, 0 0 3px rgba(0, 0, 0, 0.2);
    // background: linear-gradient(to left, #555 0%, #ddd 40%, #eee 100%);
    background: linear-gradient(to left, white, rgb(236, 236, 236));
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
  background: url("../assets/blackkey.png") center center no-repeat;
  background-size: cover;
  &.active-note {
    // box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset, 0 -2px 2px 3px rgba(0, 0, 0, 0.6) inset, 0 1px 2px rgba(0, 0, 0, 0.5);
    // background: linear-gradient(to right, #444 0%, #222 100%);
    background: url("../assets/blackkeydown.png") center center no-repeat;
    background-size: cover;
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
  color: white;
  p {
    font-size: 0.57rem;
    font-weight: 200;
    transform: rotate(90deg);
  }
}
.hint-mask {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  .hint-text {
    transform: rotate(90deg);
    text-align: right;
  }
  p {
    font-size: 0.43rem;
    font-weight: 200;
  }
  h3 {
    font-size: 0.57rem;
    font-weight: 400;
  }
  #timeline-hint {
    position: absolute;
    top: 2rem;
    right: 1rem;
  }
  #play-hint {
    position: absolute;
    bottom: 2rem;
    right: 1rem;
  }
  #longpress-hint {
    position: absolute;
    bottom: 4rem;
    right: -1rem;
  }
  #swipe-hint {
    position: absolute;
    top: 2rem;
    right: 4rem;
  }
  #clear-hint {
    position: absolute;
    bottom: 2rem;
    right: 4rem;
  }
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
#alert-mask {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  .mb-dialog {
    position: relative;
    rotate: 90deg;
    width: getRem(570);
    padding-top: getRem(75);
    border-radius: getRem(50);
    height: getRem(344);
    background-color: rgba(255, 255, 255, 0.96);
    display: flex;
    flex-direction: column;
    .title {
      flex: 1;
      padding: 0 getRem(77);
      display: flex;
      align-items: flex-end;
      position: relative;
      width: 100%;
      font-size: 0.32rem;
    }
    .input {
      flex: 2;
      flex-direction: column;
      padding: 0 getRem(77);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      position: relative;
      width: 100%;
      text-align: center;
      font-size: 0.5rem;
      input {
        background: transparent;
        border: none;
        outline: none;
        width: 100%;
        height: 1rem;
        font-size: 0.54rem;
      }
      .splitter {
        position: relative;
        width: 100%;
        height: 1px;
        background-color: gray;
        padding: 0 getRem(77);
      }
    }
    .btns {
      flex: 4;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      text-align: center;
      font-size: 0.5rem;
      span.btn {
        position: relative;
        width: 100%;
        height: 100%;
        flex: 1;
        display: flex;
        align-items: center;
        padding-top: 0.6rem;
      }
      .cancel {
        color: gray;
        text-align: right;
        justify-content: flex-start;
        padding-left: getRem(77);
      }
      .confirm {
        color: blue;
        text-align: left;
        justify-content: flex-end;
        padding-right: getRem(77);
      }
    }
  }
}
</style>
