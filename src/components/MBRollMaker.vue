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
const FULL_NOTE_NUM = 120; // tempo 180, 20seconds => 120 notes, :test 30.
const NOTE_NUM_PER_SECTOR = 10; // :test 10
const MB_DUR = 20; // 20 seconds length // :test 5
const MIN_TEMPO = 60;
const MAX_TEMPO = 180;
const NOTE_CATEGORY_PAGE_LIMIT = 18; // above this, will have scroll
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
    pieProgress
  },
  data() {
    return {
      scales,
      NOTE_CATEGORY: scales[DEFAULT_KEYBOARD_MODE].musicScale.length,
      ONE_PAGE_NOTE_NUM: 20,
      NOTE_NUM_PER_SECTOR,
      MB_DUR,
      tempo: 140,
      controlWidth: 0, // will be whole width - 50(left bar)
      configKonva: {
        width: 0,
        height: 0
      },
      configNoteRect: {},
      activeJ: -1, // highlight timeline
      sector: 1, // 2*4-1,可以滚动7次，营造处4页的氛围
      rectArray: Array(18).fill([]),
      alertAppear: false,
      alertAppear2: false,
      showExtendBtns: false,
      playing: false,
      fullloop: true,
      keyboardMode: DEFAULT_KEYBOARD_MODE,
      currentTime: 0
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
      this.configNoteRect = {
        width:
          this.NOTE_CATEGORY <= NOTE_CATEGORY_PAGE_LIMIT
            ? this.controlWidth / this.NOTE_CATEGORY
            : 36,
        height: window.innerHeight / this.ONE_PAGE_NOTE_NUM,
        fill: "#fff",
        stroke: "#000",
        strokeWidth: 0.5
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
        ...this.configNoteRect,
        x: (i * this.configKonva.width) / this.NOTE_CATEGORY,
        y: (j * this.configKonva.height) / this.ONE_PAGE_NOTE_NUM,
        fill
      };
    },
    handleTouchRect(i, j, sector) {
      // console.log(`trigger ${i},${j+(sector-1)*this.NOTE_NUM_PER_SECTOR}`)
      // make sound
      setTimeout(() => {
        synth.triggerAttackRelease(
          Tone.Frequency(
            scales[this.keyboardMode].initKey +
              scales[this.keyboardMode].musicScale[i],
            "midi"
          ),
          0.25
        );
      }, 0);

      // this.rectArray[i][j] = !this.rectArray[i][j] // this is how to assign a two dim array in vue 2.0...
      const newRow = this.rectArray[i].slice(0);
      newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newRow[
        j + (sector - 1) * this.NOTE_NUM_PER_SECTOR
      ];
      this.$set(this.rectArray, i, newRow);

      // update last
      last_i = i;
      last_j = j;
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
      clearInterval(aInterval);
      this.sector == FULL_NOTE_NUM / NOTE_NUM_PER_SECTOR - 1
        ? (this.NOTE_NUM_PER_SECTOR = NOTE_NUM_PER_SECTOR - 2)
        : (this.NOTE_NUM_PER_SECTOR = 1); // for animation,
      this.sector <= FULL_NOTE_NUM / NOTE_NUM_PER_SECTOR - 2
        ? (this.sector += 1)
        : ""; // this line is real scroll down
      // below is for animation
      aInterval = setInterval(() => {
        this.NOTE_NUM_PER_SECTOR += 1;
        if (this.NOTE_NUM_PER_SECTOR == 10) {
          clearInterval(aInterval);
        }
      }, 50);
    },
    scrollup() {
      clearInterval(aInterval);
      this.sector == 1
        ? (this.NOTE_NUM_PER_SECTOR = NOTE_NUM_PER_SECTOR + 2)
        : (this.NOTE_NUM_PER_SECTOR = 20); // for animation,
      this.sector >= 2 ? (this.sector -= 1) : "";
      aInterval = setInterval(() => {
        this.NOTE_NUM_PER_SECTOR -= 1;
        if (this.NOTE_NUM_PER_SECTOR == 10) {
          clearInterval(aInterval);
        }
      }, 50);
    },
    updateLoop() {
      this.fullloop = !this.fullloop;
      this.scheduleCursor();
      if (this.playing) {
        this.stoploop();
        this.startloop();
      }
    },
    updateKeyboard() {
      this.keyboardMode =
        this.keyboardMode == "whitekey" ? "fullkey" : "whitekey";

      this.rectArray = Array(scales[this.keyboardMode].musicScale.length).fill(
        []
      );
      this.NOTE_CATEGORY = scales[this.keyboardMode].musicScale.length;
      this.setupCanvas();
      this.alertAppear2 = false;
      // this.scheduleCursor();
      // if (this.playing) {
      //   this.stoploop();
      //   this.startloop();
      // }
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
    },
    submitProject() {
      if (this.checkBouncibility()) {
        // alert(1);
        this.bounceProject();
      } else {
        // alert(2);
        this.alertAppear = true;
      }
    },
    clearProject() {},
    btnStart(e) {
      console.log(e);
      extendBtnsTimeout = setTimeout(() => {
        //show extend buttons
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
        this.submitProject();
      } else if (
        a &&
        (a.classList.contains("playBtn") || a.classList.contains("pauseBtn"))
      ) {
        //播放
        // console.log(Tone.Transport.state)
        this.toggleReplay();
        this.showExtendBtns = false;
      } else if (
        a &&
        (a.classList.contains("playBtn") || a.classList.contains("cancelBtn"))
      ) {
        //hide extend buttons
        this.showExtendBtns = false;
      }
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
    if (this.$store.state.route.query.id) {
      this.keyboardMode = RollDemo.demo1.keyboardMode;
      this.tempo = RollDemo.demo1.tempo;
      this.rectArray = RollDemo.demo1.rectArray;
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
  <div class>
    <div class="roll" v-bind:style="{width:controlWidth+'px'}">
      <div
        :style="{width:configKonva.width+'px'}"
        style="position:absolute;height:20px;background-color:rgba(0,0,0,.5);color:white;z-index:10;display:flex;justify-content: space-around;font-size:10px"
      >
        <span
          style="width:10px;"
          v-for="i in NOTE_CATEGORY"
          :key="i"
        >{{scales[keyboardMode].initKey+scales[keyboardMode].musicScale[i-1] | toNote}}</span>
      </div>
      <v-stage :config="configKonva">
        <v-layer>
          <template v-for="i in NOTE_CATEGORY">
            <v-rect
              v-for="j in ONE_PAGE_NOTE_NUM"
              :key="`i${i}j${j}`"
              @touchstart="handleTouchRect(i-1,j-1,sector)"
              @touchmove="handleMoveRect(i-1,j-1,sector)"
              :config="setupRect(i-1,j-1,sector)"
            />
          </template>
        </v-layer>
      </v-stage>
    </div>

    <div class="control-panal">
      <div>
        <div @touchstart="scrollup" id="scrollup" class="rotate"></div>
        <div @touchstart="scrolldown" id="scrolldown"></div>
      </div>
      <div
        style="position:relative;display:flex;align-items:center;justify-content:center;transform:rotate(90deg);"
      >
        <pie-progress :progress="100*currentTime/MB_DUR"/>
        <p style="position:absolute;font-size:12px;">{{currentTime|intTime}}</p>
      </div>
      <div>
        <div @touchstart="minusTempo" id="minustempo" class="rotate"></div>
        <div id="tempo-indicator">
          <div id="tempo-progress" :style="tempoLength"></div>
          <p id="tempo-num">{{this.tempo}} bpm</p>
        </div>
        <div @touchstart="addTempo" id="addtempo" class="rotate"></div>
      </div>
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div @touchstart="updateLoop" :id="fullloop?'fullloop':'partloop'" class="rotate"></div>
      </div>
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div @touchstart="alertAppear2=true" :id="keyboardMode" class="rotate"></div>
      </div>
      <div class="btnContainer" @touchstart.stop.prevent="btnStart" @touchend.stop.prevent="btnEnd">
        <div :class="[playing?'pauseBtn':'playBtn', 'rotate']" @click="toggleReplay"></div>
        <div :class="[showExtendBtns?'extendBtnsShow':'extendBtnsHide','extendBtns']">
          <div class="bounceBtn rotate"></div>
          <div class="cancelBtn"></div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div class="alert-mask" v-show="alertAppear">
        <div class="mb-dialog">
          <div class="title">减少些音符才能做成音乐盒，是否继续上传</div>
          <div class="btns">
            <span class="btn cancel" @click="alertAppear=false">再调整</span>
            <span class="btn confirm" @click="bounceProject">任性上传</span>
          </div>
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
.roll {
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
  top: 0;
  left: 0;
  background-color: black;
  color: white;
  z-index: 100;
  #scrollup {
    width: 34px;
    height: 34px;
    background: url("../assets/left.png") center center;
    background-size: contain;
    margin-bottom: 20px;
  }
  #scrolldown {
    width: 34px;
    height: 34px;
    background: url("../assets/left.png") center center;
    background-size: contain;
    transform: rotate(270deg);
  }
  #partloop {
    width: 34px;
    height: 34px;
    background: url("../assets/viewer/partloop.png") center center;
    background-size: contain;
  }
  #fullloop {
    width: 34px;
    height: 34px;
    background: url("../assets/viewer/fullloop.png") center center;
    background-size: contain;
  }
  #fullkey {
    width: 34px;
    height: 34px;
    background: url("../assets/viewer/fullkeyboard.png") center center;
    background-size: contain;
  }
  #whitekey {
    width: 34px;
    height: 34px;
    background: url("../assets/viewer/whitekeyboard.png") center center;
    background-size: contain;
  }
  #tempo-indicator {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 18px;
    height: 154px;
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
    margin-top: 50px;
    margin-bottom: 10px;
    width: 20px;
    height: 20px;
    background: url("../assets/minus.png") center center;
    background-size: contain;
  }
  #addtempo {
    width: 20px;
    height: 20px;
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
}
</style>
