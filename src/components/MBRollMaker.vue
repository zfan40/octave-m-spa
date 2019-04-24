<script>
// TODO: IMPORTANT MEMO: reschedule(clear then schedule, might lead to jump/click)
// activeJ那块 现找播放行不行

import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
import * as WxShare from "../_common/js/wx_share";

import * as RollDemo from "../_common/js/rolldemo"; //test

import { scales } from "../_common/js/seqModes";
import pieProgress from "./common/pieProgress";
import anotherPieProgress from "./common/anotherPieProgress";
import Vue from "vue";
import VueKonva from "vue-konva";

Vue.use(VueKonva);
window.Tone = require("tone");
const musicPart = undefined;
let last_i = -1;
let last_j = -1;
window.cursorSchedules = [];
let aInterval = undefined;
let extendBtnsTimeout = undefined;
const TIME_PER_NOTE = 0.25; // quarter note seemingly
const FULL_NOTE_NUM = 120; // max tempo 180, 20seconds => 120 notes, :test 30.
const NOTE_NUM_PER_SECTOR = 10; // :test 10
const MB_DUR = 20; // 20 seconds length // :test 5
const MIN_TEMPO = 60;
const MAX_TEMPO = 180;
const NOTE_CATEGORY_PAGE_LIMIT = 12; // above this, will have scroll
const DEFAULT_KEYBOARD_MODE = "whitekey";
const synth = new Tone.Sampler(
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

// var pulseOptions = {
//   oscillator: {
//     type: "triangle"
//   },
//   envelope: {
//     release: 0.07
//   }
// };
// const piano = new Tone.PolySynth(18, Tone.Synth, pulseOptions).toMaster();
export default {
  components: {
    pieProgress,
    anotherPieProgress
  },
  data() {
    return {
      scales,
      NOTE_CATEGORY: scales[DEFAULT_KEYBOARD_MODE].musicScale.length,
      ONE_PAGE_NOTE_NUM: 20,
      NOTE_NUM_PER_SECTOR,
      CONST_NOTE_NUM_PER_SECTOR: NOTE_NUM_PER_SECTOR,
      MB_DUR,
      tempo: 120,
      controlWidth: 0, // will be whole width - 50(left bar)
      configKonva: {
        width: 0,
        height: 0
      },
      borderConfig: {},
      halfConfig: {},
      noteRectConfig: {},
      activeJ: -1, // highlight timeline
      sector: 1, // 2*4-1,可以滚动7次，营造处4页的氛围
      rectArray: Array(scales[DEFAULT_KEYBOARD_MODE].musicScale.length)
        .fill(1)
        .map(i => []),
      alertAppear: false,
      alertAppear2: false,
      menuAppear: false,
      showExtendBtns: false,
      playing: false,
      fullloop: true,
      beat: 8, // only 3 or 4, only for view
      keyboardMode: DEFAULT_KEYBOARD_MODE,
      currentTime: 0,
      teethNum: 18
    };
  },
  filters: {
    intTime: floatTime => {
      return Math.floor(floatTime) % 20;
      // return floatTime
    },
    toNote: midiNum => Tone.Frequency(midiNum, "midi").toNote()
  },
  computed: {
    tempoLength() {
      const k = 100 / (MAX_TEMPO - MIN_TEMPO);
      const b = -(MIN_TEMPO * k);
      return { height: `${k * this.tempo + b}%` };
    }
  },
  methods: {
    setupCanvas() {
      const docElem = document.documentElement;
      this.controlWidth = docElem.getBoundingClientRect().width - 50;
      this.configKonva = {
        width:
          this.NOTE_CATEGORY <= NOTE_CATEGORY_PAGE_LIMIT
            ? this.controlWidth
            : this.NOTE_CATEGORY * 36,
        height: window.innerHeight
      };
      this.RECTWIDTH =
        this.NOTE_CATEGORY <= NOTE_CATEGORY_PAGE_LIMIT
          ? this.controlWidth / this.NOTE_CATEGORY
          : 36;
      this.RECTHEIGHT = window.innerHeight / this.ONE_PAGE_NOTE_NUM;
      this.noteRectConfig = {
        perfectDrawEnabled: false,
        transformsEnabled: "position",
        width: this.RECTWIDTH,
        height: this.RECTHEIGHT,
        fill: "#fff",
        stroke: "#000",
        strokeWidth: 0.5,
        dash: [
          this.RECTWIDTH + this.RECTHEIGHT,
          this.RECTWIDTH,
          this.RECTHEIGHT,
          0
        ]
      };
      this.borderConfig = {
        perfectDrawEnabled: false,
        transformsEnabled: "position",
        width: this.RECTWIDTH,
        height: this.RECTHEIGHT,
        // fill: "none",
        stroke: "#000",
        strokeWidth: 2,
        dash: [this.RECTWIDTH, this.RECTWIDTH + 2 * this.RECTHEIGHT]
      };
      this.halfConfig = {
        perfectDrawEnabled: false,
        transformsEnabled: "position",
        width: this.RECTWIDTH,
        height: this.RECTHEIGHT,
        // fill: "none",
        stroke: "#333",
        strokeWidth: 2,
        dash: [this.RECTWIDTH, this.RECTWIDTH + 2 * this.RECTHEIGHT]
      };
      this.scheduleCursor();
    },
    scheduleCursor() {
      const fullNoteNumWithinDur = Math.ceil(
        MB_DUR / ((TIME_PER_NOTE * 120) / this.tempo)
      );
      // const fullNoteNumWithinDur = 10;
      // console.log('full note num', fullNoteNumWithinDur);
      // let lastTiming = 0;
      let currentSector = this.sector;
      console.log("sdfsdfsdf", currentSector);
      const partNoteNumStart = (this.sector - 1) * this.NOTE_NUM_PER_SECTOR;
      const partNoteNumEnd =
        partNoteNumStart + this.ONE_PAGE_NOTE_NUM <= fullNoteNumWithinDur
          ? partNoteNumStart + this.ONE_PAGE_NOTE_NUM
          : fullNoteNumWithinDur;
      console.log(fullNoteNumWithinDur);
      console.log(partNoteNumStart, partNoteNumEnd);
      for (let i = 0; i <= FULL_NOTE_NUM - 1; i++) {
        if (
          (this.fullloop && i <= fullNoteNumWithinDur - 1) || //under fullloop
          (!this.fullloop && //under part loop
          i >= partNoteNumStart && //within available parts
            i <= partNoteNumEnd - 1)
        ) {
          // 在有效范围，已规划 => 要修改
          Tone.Transport.clear(cursorSchedules[i]);
          cursorSchedules[i] = Tone.Transport.scheduleRepeat(
            time => {
              this.activeJ = i;

              // feat: cursor follow
              // this.sector = Math.ceil(this.activeJ / NOTE_NUM_PER_SECTOR);
              if (currentSector % 2 === 1) {
                console.log("normal");
                this.sector =
                  2 * Math.floor(this.activeJ / this.ONE_PAGE_NOTE_NUM) + 1;
              } else {
                console.log("abnormal");
                //这块是半拉
                this.sector =
                  2 *
                    Math.floor(
                      (this.activeJ - NOTE_NUM_PER_SECTOR) /
                        this.ONE_PAGE_NOTE_NUM
                    ) +
                  2;
                if (this.activeJ == fullNoteNumWithinDur - 1) {
                  //如何判断到头，到头了复原
                  currentSector = 1;
                }
              }
              console.log(this.sector);
              this.currentTime = (i * TIME_PER_NOTE * 120) / this.tempo;
              // const now = performance.now();
              // console.log(now - lastTiming);
              // lastTiming = now;
              this.rectArray.forEach((noteSeq, noteIndex) => {
                if (noteSeq[i]) {
                  synth.triggerAttackRelease(
                    Tone.Frequency(
                      scales[this.keyboardMode].initKey +
                        scales[this.keyboardMode].musicScale[noteIndex],
                      "midi"
                    ),
                    0.25
                  );
                }
              });
              // synth.triggerAttackRelease(Tone.Frequency(60, 'midi'), 0.1);
            },
            this.fullloop
              ? (fullNoteNumWithinDur * TIME_PER_NOTE * 120) / this.tempo
              : ((partNoteNumEnd - partNoteNumStart) * TIME_PER_NOTE * 120) /
                  this.tempo,
            (i * TIME_PER_NOTE * 120) / this.tempo
          );
        } else if (
          cursorSchedules[i] && //for the notes that have been schedule
          ((this.fullloop && i > fullNoteNumWithinDur - 1) || //if under fullloop, for those outside fullNote
            (!this.fullloop &&
              (i < partNoteNumStart || i > partNoteNumEnd - 1))) // if under partloop, for those outside availablecurrentpage
        ) {
          // 不在有效范围，已规划 => 不清除，但禁掉
          Tone.Transport.clear(cursorSchedules[i]);
          cursorSchedules[i] = "";
        } else {
          // 不在有效范围，未规划 => 储存，但不规划
        }
      }
      console.log(cursorSchedules);
      console.log(Tone.Transport._scheduledEvents);
    },
    // setupBeatText(i, sector) {
    //   return {
    //     x: 14,
    //     y: (i * this.configKonva.width) / this.NOTE_CATEGORY,
    //     fill: "#ffff00",
    //     text: i / this.beat
    //   };
    // },
    setupBeat(i, j, sector) {
      // split NOTE_NUM_PER_SECTOR and this.NOTE_NUM_PER_SECTOR for ANIMATION!!!
      const index =
        j + (sector - 2) * NOTE_NUM_PER_SECTOR + 1 * this.NOTE_NUM_PER_SECTOR;
      // if (index % this.beat == 0)
      return {
        ...this.borderConfig,
        x: (i * this.configKonva.width) / this.NOTE_CATEGORY,
        y: (j * this.configKonva.height) / this.ONE_PAGE_NOTE_NUM
      };
    },
    setupHalf(i, j, sector) {
      return {
        ...this.halfConfig,
        x: (i * this.configKonva.width) / this.NOTE_CATEGORY,
        y: (j * this.configKonva.height) / this.ONE_PAGE_NOTE_NUM
      };
    },
    setupRect(i, j, sector) {
      let fill = "";
      // split NOTE_NUM_PER_SECTOR and this.NOTE_NUM_PER_SECTOR for ANIMATION!!!
      const index =
        j + (sector - 2) * NOTE_NUM_PER_SECTOR + 1 * this.NOTE_NUM_PER_SECTOR;
      const withinDur = (index * TIME_PER_NOTE * 120) / this.tempo < MB_DUR;
      if (index == this.activeJ && this.rectArray[i][index]) {
        // active current note: lighter color
        fill = withinDur ? "#6477b1" : "#A9B9FF";
      } else if (index == this.activeJ && !this.rectArray[i][index]) {
        // inactive current light blue
        fill = withinDur ? "#292B3A" : "#2B2E3D";
      } else if (this.rectArray[i][index]) {
        // active non-current note
        fill = withinDur ? "#9FB2CF" : "#333740";
      } else {
        // incative non-current note
        fill = withinDur
          ? `rgba(0,0,0,${0.9 - (i * 0.22) / this.NOTE_CATEGORY})`
          : "#131315";
      }
      return {
        ...this.noteRectConfig,
        x: (i * this.configKonva.width) / this.NOTE_CATEGORY,
        y: (j * this.configKonva.height) / this.ONE_PAGE_NOTE_NUM,
        fill
        // stroke: index % this.beat === 0 ? "#ffff00" : "#000",
        // dash: index % this.beat === 0 ? [0] : [0]
      };
    },
    handleTouchRect(i, j, sector) {
      // console.log(`trigger ${i},${j+(sector-1)*this.NOTE_NUM_PER_SECTOR}`)
      // make sound
      // setTimeout(() => {
      synth.triggerAttackRelease(
        Tone.Frequency(
          scales[this.keyboardMode].initKey +
            scales[this.keyboardMode].musicScale[i],
          "midi"
        ),
        0.25
      );
      // }, 0);

      // this.rectArray[i][j] = !this.rectArray[i][j] // this is how to assign a two dim array in vue 2.0...
      const newRow = this.rectArray[i].slice(0);
      newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newRow[
        j + (sector - 1) * this.NOTE_NUM_PER_SECTOR
      ];
      this.$set(this.rectArray, i, newRow);
      // update last
      last_i = i;
      last_j = j;
      this.saveProjectToLocaoStorage();
    },
    handleMoveRect(i, j, sector) {
      const fullJ = j + (sector - 1) * this.NOTE_NUM_PER_SECTOR;
      const fullLastJ = last_j + (sector - 1) * this.NOTE_NUM_PER_SECTOR;
      if (j != last_j) {
        // take this as real note, store arrange
        this.handleTouchRect(i, j, sector);
      } else if (i != last_i && j == last_j) {
        // take this as testing note, no store, no arrange
        // make sound
        synth.triggerAttackRelease(
          Tone.Frequency(
            scales[this.keyboardMode].initKey +
              scales[this.keyboardMode].musicScale[i],
            "midi"
          ),
          0.25
        );
        // operate current note view
        const newRow = this.rectArray[i].slice(0);
        newRow[fullJ] = !newRow[fullJ];
        this.$set(this.rectArray, i, newRow);

        // restore last note view
        const newLastRow = this.rectArray[last_i].slice(0);
        newLastRow[fullLastJ] = !newLastRow[fullLastJ];
        this.$set(this.rectArray, last_i, newLastRow);

        // update last
        last_i = i;
        last_j = j;
      } else {
        // console.log(`ignore ${i},${j}`)
      }
    },
    startloop() {
      // start from the current sector start(start,offset)
      this.scheduleCursor(); //其实没什么用，只是为了更新下currentSector，翻页比较自然。。。其他没用
      console.log(this.rectArray);
      //issue: autoplay, https://github.com/Tonejs/Tone.js/issues/341
      if (Tone.context.state !== "running") {
        Tone.context.resume();
      }
      Tone.Transport.start(
        "+0.1",
        ((this.sector - 1) * this.NOTE_NUM_PER_SECTOR * TIME_PER_NOTE * 120) /
          this.tempo
      );
      // Tone.Transport.start(
      //   "+0.1",
      //   (this.activeJ * TIME_PER_NOTE * 120) / this.tempo
      // );
      this.playing = true;
    },
    stoploop() {
      Tone.Transport.stop();
      this.playing = false;
    },
    toggleReplay() {
      if (this.playing) this.stoploop();
      else this.startloop();
    },
    minusTempo() {
      if (this.tempo > MIN_TEMPO) {
        this.tempo -= 5;
        Tone.Transport.seconds =
          (this.activeJ * TIME_PER_NOTE * 120) / this.tempo;
        Tone.Transport.bpm.rampTo(this.tempo, 0.01);
        setTimeout(() => {
          // bpm ramp to, so need a settimeout
          this.scheduleCursor();
        }, 200);
      }
    },
    addTempo() {
      if (this.tempo < MAX_TEMPO) {
        this.tempo += 5;
        Tone.Transport.seconds =
          (this.activeJ * TIME_PER_NOTE * 120) / this.tempo;
        Tone.Transport.bpm.rampTo(this.tempo, 0.01);
        setTimeout(() => {
          this.scheduleCursor();
        }, 200);
      }
    },
    scrolldown() {
      // clearInterval(aInterval);
      // this.sector == FULL_NOTE_NUM / NOTE_NUM_PER_SECTOR - 1
      //   ? (this.NOTE_NUM_PER_SECTOR = NOTE_NUM_PER_SECTOR - 2)
      //   : (this.NOTE_NUM_PER_SECTOR = 1); // for animation,
      this.sector <= FULL_NOTE_NUM / NOTE_NUM_PER_SECTOR - 2
        ? (this.sector += 1)
        : ""; // this line is real scroll down
      // below is for animation
      // aInterval = setInterval(() => {
      //   this.NOTE_NUM_PER_SECTOR += 1;
      //   if (this.NOTE_NUM_PER_SECTOR == 10) {
      //     clearInterval(aInterval);
      //   }
      // }, 50);
    },
    scrollup() {
      // clearInterval(aInterval);
      // this.sector == 1
      //   ? (this.NOTE_NUM_PER_SECTOR = NOTE_NUM_PER_SECTOR + 2)
      //   : (this.NOTE_NUM_PER_SECTOR = 20); // for animation,
      this.sector >= 2 ? (this.sector -= 1) : "";
      // below is for animation
      // aInterval = setInterval(() => {
      //   this.NOTE_NUM_PER_SECTOR -= 1;
      //   if (this.NOTE_NUM_PER_SECTOR == 10) {
      //     clearInterval(aInterval);
      //   }
      // }, 50);
    },
    scrollToBegin() {
      clearInterval(aInterval);
      this.sector = 1;
    },
    // scrollToEnd() {
    //         clearInterval(aInterval);
    //   this.sector = 1;
    // }
    updateLoop() {
      this.fullloop = !this.fullloop;
      this.scheduleCursor();
      if (this.playing) {
        this.stoploop();
        this.startloop();
      }
    },
    clearNotes() {
      this.rectArray = Array(scales[this.keyboardMode].musicScale.length)
        .fill(1)
        .map(i => []);
    },
    chooseKeyboard(keyboardMode) {
      if (this.keyboardMode == keyboardMode) return;
      this.alertAppear2 = true;
      this.saveProjectToLocaoStorage();
    },
    updateBeat(newbeat) {
      this.beat = newbeat;
      this.saveProjectToLocaoStorage();
    },
    updateKeyboard() {
      //肯定是切换了嘛
      this.keyboardMode =
        this.keyboardMode == "whitekey" ? "fullkey" : "whitekey";
      this.rectArray = Array(scales[this.keyboardMode].musicScale.length)
        .fill(1)
        .map(i => []);
      this.NOTE_CATEGORY = scales[this.keyboardMode].musicScale.length;
      this.setupCanvas();
      this.alertAppear2 = false;
      this.menuAppear = false;
      this.saveProjectToLocaoStorage();
    },
    checkBouncibility() {
      const result = [];
      for (let i = 0; i <= this.NOTE_CATEGORY - 1; i++) {
        for (let j = 0; j <= FULL_NOTE_NUM - 1; j++) {
          if (this.rectArray[i][j]) {
            result.push({
              note: Tone.Frequency(
                scales[this.keyboardMode].initKey +
                  scales[this.keyboardMode].musicScale[i],
                "midi"
              ).toNote(),
              time: (j * TIME_PER_NOTE * 120) / this.tempo
            });
          }
        }
      }
      result.sort((a, b) => 0 + a.time - b.time);
      return Magic.RealMagic(result);
    },
    bounceProject() {
      // finally get something like [{note:'A4',time:0},{note:'A5',time:0.3227}]
      const result = [];
      for (let i = 0; i <= this.NOTE_CATEGORY - 1; i++) {
        for (let j = 0; j <= FULL_NOTE_NUM - 1; j++) {
          if (this.rectArray[i][j]) {
            result.push({
              note: Tone.Frequency(
                scales[this.keyboardMode].initKey +
                  scales[this.keyboardMode].musicScale[i],
                "midi"
              ).toNote(),
              time: (j * TIME_PER_NOTE * 120) / this.tempo
            });
          }
        }
      }
      this.$store
        .dispatch("BOUNCE_PROJECT", {
          record: result,
          info: {
            title: "尚未起名",
            content: "",
            cover: ""
          }
        })
        .then(id => {
          console.log("successfully bounced");
          this.bouncing = false;
          this.$toast("作品已为您存储");
          // clear tone
          cursorSchedules.forEach(schedule => Tone.Transport.clear(schedule));
          // cursorSchedules = [];
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
    },
    submitProject() {
      this.menuAppear = false;
      if (
        this.rectArray.reduce((acc, val) => acc.concat(val), []).length === 0 //flat方法摩羯浏览器不支持
      ) {
        this.$toast("作品不能为空");
        return;
      }
      this.teethNum = this.checkBouncibility();
      if (this.teethNum <= 18) {
        this.bounceProject();
      } else {
        this.alertAppear = true;
      }
    },
    btnEnd(e) {
      this.toggleReplay();
    },
    saveProjectToLocaoStorage() {
      const work = {
        keyboardMode: this.keyboardMode,
        rectArray: this.rectArray,
        beat: this.beat
      };
      window.localStorage.setItem("rollwork", JSON.stringify(work));
    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone();
    next();
  },
  created() {
    this.scales = scales; //view层需要
    this.setupCanvas();

    // test, load a demo work
    console.log(RollDemo.demo1);
    // 有id 代表是某个模版的再创作
    const workInCookie = window.localStorage.getItem("rollwork");
    if (this.$store.state.route.query.id) {
      this.keyboardMode = RollDemo.demo1.keyboardMode;
      this.tempo = RollDemo.demo1.tempo;
      this.rectArray = RollDemo.demo1.rectArray;
      this.beat = RollDemo.demo1.beat;
      this.scheduleCursor();
    } else if (workInCookie) {
      console.log("kiokiokio");
      console.log(workInCookie);
      console.log(typeof workInCookie);
      const workInCookieObj = JSON.parse(workInCookie);
      this.keyboardMode = workInCookieObj.keyboardMode || "whitekey";
      this.tempo = workInCookieObj.tempo || 120;
      this.rectArray =
        workInCookieObj.rectArray ||
        Array(scales[this.keyboardMode].musicScale.length)
          .fill(1)
          .map(i => []);
      this.beat = workInCookieObj.beat || 8;
      this.scheduleCursor();
    }
    // regular setup
    const self = this;
    Tone.Transport.cancel();
    // this is very important
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + "px";

    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) return;
    // alert(Cookies.get('serviceToken'))
    WxShare.prepareShareConfig().then(() => {
      WxShare.prepareShareContent({
        title: "MUSIXISE",
        desc: "划拉划拉八音盒",
        fullPath: `${location.origin}${location.pathname}#/new-music-box-roll`,
        imgUrl: "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
      });
    });
    if (Util.getUrlParam("code") || Cookies.get("serviceToken")) {
      Api.getUserInfo(Util.getUrlParam("code"))
        .then(res => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove("serviceToken");
            location.replace(
              // will publish to node project m-musixise, under '/music-box' path
              `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
                location.origin + location.pathname + "#/new-music-box-roll"
              )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
            );
          }
          console.log("get user info success", res.data.data);
        })
        .catch(err => {
          Cookies.remove("serviceToken");
          location.replace(
            `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
              location.origin + location.pathname + "#/new-music-box-roll"
            )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
          );
        });
    } else {
      //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
          location.origin + location.pathname + "#/new-music-box-roll"
        )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
      );
    }
  },
  mounted() {},
  updated() {}
};
</script>

<template>
  <div class="container">
    <div class="roll" v-bind:style="{width:controlWidth+'px'}">
      <div
        :style="{width:configKonva.width+'px'}"
        style="position:absolute;height:20px;background-color:rgba(0,0,0,.5);color:white;z-index:10;display:flex;justify-content: space-around;font-size:10px"
      >
        <span
          style="position:relative;width:10px;transform-origin: 0% 0%;left: 10px;"
          class="rotate"
          v-for="i in NOTE_CATEGORY"
          :key="i"
        >{{scales[keyboardMode].initKey+scales[keyboardMode].musicScale[i-1] | toNote}}</span>
      </div>
      <v-stage :config="configKonva">
        <v-layer>
          <template v-for="i in NOTE_CATEGORY">
            <template v-for="j in ONE_PAGE_NOTE_NUM">
              <v-rect
                :key="`i${i}j${j}`"
                @touchstart="handleTouchRect(i-1,j-1,sector)"
                @touchmove="handleMoveRect(i-1,j-1,sector)"
                :config="setupRect(i-1,j-1,sector)"
              />
              <!-- quarter note line -->
              <!-- <v-rect
                v-if="(j + (sector - 2) * CONST_NOTE_NUM_PER_SECTOR + 1 * NOTE_NUM_PER_SECTOR)%2===1"
                :key="`halfi${i}j${j}`"
                @touchstart="handleTouchRect(i-1,j-1,sector)"
                @touchmove="handleMoveRect(i-1,j-1,sector)"
                :config="setupHalf(i-1,j-1,sector)"
              />-->
              <!-- measure line -->
              <v-rect
                v-if="(j + (sector - 2) * CONST_NOTE_NUM_PER_SECTOR + 1 * NOTE_NUM_PER_SECTOR)%beat===1"
                :key="`borderi${i}j${j}`"
                @touchstart="handleTouchRect(i-1,j-1,sector)"
                @touchmove="handleMoveRect(i-1,j-1,sector)"
                :config="setupBeat(i-1,j-1,sector)"
              />
            </template>
            <!-- <v-text v-if="i%beat ==0" :key="`beat${i}`" :config="setupBeatText(i,sector)"/> -->
          </template>
        </v-layer>
      </v-stage>
    </div>

    <div class="control-panal">
      <div style="height:6rem;display:flex;flex-direction:column;">
        <div @touchstart="menuAppear=true" id="menuicon" class="rotate"></div>
        <div v-show="!playing" @touchstart="scrollToBegin" id="scrolltop" class="rotate"></div>
        <div v-show="!playing" @touchstart="scrollup" id="scrollup" class="rotate"></div>
        <div v-show="!playing" @touchstart="scrolldown" id="scrolldown" class="rotate"></div>
        <div
          v-show="playing"
          @touchstart="updateLoop"
          :id="fullloop?'fullloop':'partloop'"
          class="rotate"
        ></div>
        <!-- <div @touchstart="scrollToEnd" id="scrollbottom" class="rotate"></div> -->
      </div>
      <!-- <div
        style="position:relative;display:flex;align-items:center;justify-content:center;transform:rotate(90deg);"
      >-->
      <!-- <pie-progress :progress="100*currentTime/MB_DUR"/> -->
      <!-- <another-pie-progress radius="30" :progress="currentTime*100/MB_DUR" stroke="4"/>
        <p style="position:absolute;font-size:12px;">{{currentTime|intTime}}</p>
      </div>-->
      <div>
        <div @touchstart="minusTempo" id="minustempo" class="rotate"></div>
        <div id="tempo-indicator">
          <div id="tempo-progress" :style="tempoLength"></div>
          <p id="tempo-num">{{this.tempo}} bpm</p>
        </div>
        <div @touchstart="addTempo" id="addtempo" class="rotate"></div>
      </div>

      <div class="btnContainer" @touchend.stop.prevent="btnEnd">
        <another-pie-progress :radius="30" :progress="currentTime*100/MB_DUR" :stroke="4"/>
        <div :class="[playing?'pauseBtn':'playBtn', 'rotate']" @click="toggleReplay"></div>
      </div>
    </div>

    <transition name="fade">
      <div class="alert-mask" v-show="alertAppear">
        <div class="mb-dialog">
          <div class="title">超了{{teethNum-18}}个音符，目前无法做成实体八音盒，是否继续上传</div>
          <div class="btns">
            <span class="btn cancel" @click="alertAppear=false">再调整</span>
            <span class="btn confirm" @click="bounceProject">任性上传</span>
          </div>
        </div>
      </div>
    </transition>
    <transition name="slide">
      <div class="alert-mask" v-show="menuAppear" @touchstart.self="menuAppear=false">
        <div class="menu">
          <div @touchstart="updateBeat(8)" :class="['menu-op',beat===4*2?'':'inactive']">4拍</div>
          <div @touchstart="updateBeat(6)" :class="['menu-op',beat===3*2?'':'inactive']">3拍</div>
          <div
            @touchstart="chooseKeyboard('whitekey')"
            :class="['menu-op',keyboardMode=='whitekey'?'':'inactive']"
          >
            <div id="whitekey" class="rotate"></div>简单音符
          </div>
          <div
            @touchstart="chooseKeyboard('fullkey')"
            :class="['menu-op',keyboardMode=='fullkey'?'':'inactive']"
          >
            <div id="fullkey" class="rotate"></div>复杂音符
          </div>

          <div @touchstart="clearNotes" class>清空作品</div>
          <div @touchstart="submitProject" class>完成作品</div>
          <div @touchstart="menuAppear=false" class>退出</div>
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div class="alert-mask" v-show="alertAppear2">
        <div class="mb-dialog">
          <div class="title">转换键盘将清空现有作品</div>
          <div class="btns">
            <span class="btn cancel" @click="alertAppear2=false">取消</span>
            <span class="btn confirm" @click="updateKeyboard">转换键盘</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
.container {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  background-color: #404249;
  // position: relative;
}
.roll {
  background-color: white;
  position: absolute;
  right: 0;
  overflow: scroll;
}
.control-panal {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  width: 50px;
  height: 100%;
  padding: 16px 0;
  top: 0;
  left: 0;
  background-color: black;
  color: white;
  z-index: 100;
  #clear {
    width: 34px;
    height: 34px;
    background: url("../assets/clear.png") center center no-repeat;
    background-size: contain;
  }
  #menuicon {
    width: 34px;
    height: 34px;
    background: url("../assets/menu.png") center center no-repeat;
    background-size: cover;
    margin-bottom: 20px;
  }

  #scrolltop {
    width: 34px;
    height: 34px;
    background: url("../assets/rewind1.png") center center no-repeat;
    background-size: contain;
    margin-bottom: 20px;
  }
  #scrollbottom {
    width: 34px;
    height: 34px;
    background: url("../assets/rewind2.png") center center no-repeat;
    background-size: contain;
    margin-bottom: 20px;
  }
  #scrollup {
    width: 34px;
    height: 34px;
    background: url("../assets/left.png") center center no-repeat;
    background-size: contain;
    margin-bottom: 20px;
  }
  #scrolldown {
    width: 34px;
    height: 34px;
    background: url("../assets/left.png") center center no-repeat;
    background-size: contain;
    transform: rotate(270deg);
    margin-bottom: 20px;
  }
  #partloop {
    width: 34px;
    height: 34px;
    background: url("../assets/viewer/partloop.png") center center no-repeat;
    background-size: contain;
  }
  #fullloop {
    width: 34px;
    height: 34px;
    background: url("../assets/viewer/fullloop.png") center center no-repeat;
    background-size: contain;
  }
  #fullkey {
    width: 34px;
    height: 34px;
    background: url("../assets/fullkey.png") center center no-repeat;
    background-size: contain;
  }
  #whitekey {
    width: 34px;
    height: 34px;
    background: url("../assets/whitekey.png") center center no-repeat;
    background-size: contain;
  }
  #tempo-indicator {
    position: relative;
    display: flex;
    margin: 0 auto;
    justify-content: center;
    align-items: center;
    width: 18px;
    height: 160px;
    // height: 60px;
    border-radius: 9px;
    border: 1px solid #25252b;
    background-color: #25252b;
    #tempo-progress {
      position: absolute;
      top: 0;
      width: 16px;
      // height:140px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 9px;
      display: flex;
      align-items: center;
      // border:solid 1px transparent;
    }
    #tempo-num {
      position: absolute;
      width: 60px;
      left: -22px;
      transform: rotate(90deg);
      color: white;
      font-size: 14px;
    }
  }
  #minustempo {
    margin-top: 0px; //todo more space here
    margin-bottom: 10px;
    width: 34px;
    height: 34px;
    background: url("../assets/minus.png") center center;
    background-size: contain;
  }
  #addtempo {
    width: 34px;
    height: 34px;
    margin-top: 10px;
    background: url("../assets/plus.png") center center;
    background-size: contain;
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
.btnContainer {
  // position: relative;
  // width: getRem(84);
  // height: getRem(84);
  // margin-top: 0.3rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  .playBtn {
    z-index: 2;
    position: absolute;
    width: 34px;
    height: 34px;
    border-radius: 0.56rem;
    background: url("../assets/play.svg") center center no-repeat;
    background-size: 0.38rem;
    background-color: #456aff;
  }
  .pauseBtn {
    z-index: 2;
    position: absolute;
    width: 34px;
    height: 34px;
    border-radius: 0.56rem;
    background: url("../assets/pause.svg") center center no-repeat;
    background-size: 0.42667rem;
    background-color: #456aff;
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
    left: getRem(600);
    background: url("../assets/cancel.svg") center center no-repeat;
    // background-size: getRem(32);
  }
  .extendBtns {
    // this element is within rotate, everything is opposite
    position: absolute;
    height: getRem(84);
    border-radius: getRem(42);
    overflow: hidden;
    left: 0px;
    z-index: 1;
    transition: width 1s;
    background: linear-gradient(
      to left,
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
.rotate {
  transform: rotate(90deg);
}
.alert-mask {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .mb-dialog {
    position: relative;
    transform: rotate(90deg);
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
  .menu {
    display: flex;
    top: 0;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    position: absolute;
    // padding: getRem(40);
    font-size: 0.5rem;
    // top: 0;
    bottom: -3.6rem;
    width: getRem(240 * 2);
    height: getRem(375 * 2);
    background-color: $dark-gray;
    color: white;
    // important rotate
    left: 100%;
    transform-origin: 0% 0%;
    transform: rotate(90deg);
    .menu-op {
      background-color: #3c3f4b;
    }
    #fullkey {
      width: 34px;
      height: 34px;
      margin-right: 4px;
      background: url("../assets/fullkey.png") center center no-repeat;
      background-size: contain;
    }
    #whitekey {
      width: 34px;
      height: 34px;
      margin-right: 4px;
      background: url("../assets/whitekey.png") center center no-repeat;
      background-size: contain;
    }
    .inactive {
      opacity: 0.4;
    }
    > div {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: $dark-gray;
    }
  }
}
.slide-enter-active {
  transition: all 0.3s ease-out;
  top: 0px;
}
.slide-leave-active {
  transition: all 0.3s ease-out;
  top: 0px;
}
.slide-enter, .slide-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  opacity: 0;
  top: -200px;
}
</style>
