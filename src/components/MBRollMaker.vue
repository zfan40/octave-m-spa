<script>
// TODO: IMPORTANT MEMO: reschedule(clear then schedule, might lead to jump/click)
// activeJ那块 现找播放行不行
window.Tone = require("tone");
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
// import countButton from './common/countButton'
import * as WxShare from "../_common/js/wx_share";
let musicPart = undefined;
import Vue from "vue";
import VueKonva from "vue-konva";
const musicScale = [
  0,
  2,
  4,
  5,
  7,
  9,
  11,
  12,
  14,
  16,
  17,
  19,
  21,
  23,
  24,
  26,
  28,
  29
];
// const colors = ['#8fd3c7', '#95c631', '#edda28', '#f7943d', '#e43159', '#bf4ea8', '#4d61d9', '#45b5a1', '#8fd3c7', '#95c631', '#edda28', '#f7943d', '#e43159', '#bf4ea8', '#4d61d9', '#45b5a1', '#edda28', '#f7943d']
const colors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
colors.fill("#9FB2CF", 0, 18);
const invalid_colors = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18
];
invalid_colors.fill("#7D90AD", 0, 18);
let last_i = -1;
let last_j = -1;
window.schedules = [];
window.cursor_schedules = [];
let aInterval = undefined;
let extendBtnsTimeout = undefined;
const TIME_PER_NOTE = 0.25;
const FULL_NOTE_NUM = 40; //80 notes, then if set 20 per page, it would be 4 pages
const NOTE_NUM_PER_SECTOR = 10;
const MB_DUR = 5; // 20 seconds length
const MIN_TEMPO = 60;
const MAX_TEMPO = 180;
Vue.use(VueKonva);
var synth = new Tone.Sampler(
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
      configNoteRect: {},
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
      showExtendBtns: false,
      playing: false
    };
  },
  computed: {},
  methods: {
    setupCanvas() {
      const docElem = document.documentElement;
      this.configKonva = {
        width: docElem.getBoundingClientRect().width - 50,
        height: window.innerHeight
      };
      this.configNoteRect = {
        width:
          (docElem.getBoundingClientRect().width - 50) / this.NOTE_CATEGORY,
        height: window.innerHeight / this.ONE_PAGE_NOTE_NUM,
        fill: "#fff",
        stroke: "#000",
        strokeWidth: 0.5
      };
      this.scheduleCursor();
    },
    scheduleCursor() {
      const fullNoteNumWithinDur = Math.ceil(
        MB_DUR / (TIME_PER_NOTE * 120 / this.tempo)
      );
      console.log("full note num", fullNoteNumWithinDur);
      for (let i = 0; i <= FULL_NOTE_NUM - 1; i++) {
        if (i <= fullNoteNumWithinDur - 1 && cursor_schedules[i]) {
          // 在有效范围，已规划 => 要修改
          Tone.Transport.clear(cursor_schedules[i]);
          cursor_schedules[i] = Tone.Transport.scheduleRepeat(
            time => {
              this.activeJ = i;
              synth.triggerAttackRelease(Tone.Frequency(60, "midi"), 0.5);
              // TODO: if has notes to play, play them here, 就不需要schedules这个数组了
              // TODO：得保证cursor 这块稳
            },
            // MB_DUR, //不能用这个，因为20秒很可能最后一个音弄不完，得是整数音长度
            fullNoteNumWithinDur * TIME_PER_NOTE * 120 / this.tempo,
            i * TIME_PER_NOTE * 120 / this.tempo
          );
        } else if (i <= fullNoteNumWithinDur - 1 && !cursor_schedules[i]) {
          // 在有效范围，未规划 => 新规划
          cursor_schedules[i] = Tone.Transport.scheduleRepeat(
            time => {
              this.activeJ = i;
              synth.triggerAttackRelease(Tone.Frequency(60, "midi"), 0.5);
            },
            // MB_DUR,
            fullNoteNumWithinDur * TIME_PER_NOTE * 120 / this.tempo,
            i * TIME_PER_NOTE * 120 / this.tempo
          );
        } else if (i > fullNoteNumWithinDur - 1 && cursor_schedules[i]) {
          // 不在有效范围，已规划 => 不清除，但禁掉
          Tone.Transport.clear(cursor_schedules[i]);
        } else {
          // 不在有效范围，未规划 => 储存，但不规划
        }
      }
    },
    scheduleAllNotes() {
      const fullNoteNumWithinDur = Math.ceil(
        MB_DUR / (TIME_PER_NOTE * 120 / this.tempo)
      );
      for (let i = 0; i <= this.NOTE_CATEGORY - 1; i++) {
        for (let j = 0; j <= FULL_NOTE_NUM - 1; j++) {
          if (j < fullNoteNumWithinDur) {
            // 在有效范围，已规划 => 要修改
            if (schedules[i][j]) {
              console.log(schedules[i][j]);
              Tone.Transport.clear(schedules[i][j]);
            }
            if (this.rectArray[i][j]) {
              schedules[i][j] = Tone.Transport.scheduleRepeat(
                time => {
                  synth.triggerAttackRelease(
                    Tone.Frequency(60 + musicScale[i], "midi"),
                    0.5
                  );
                },
                fullNoteNumWithinDur * TIME_PER_NOTE * 120 / this.tempo,
                // MB_DUR,
                j * TIME_PER_NOTE * 120 / this.tempo
              );
            }
          } else if (j > fullNoteNumWithinDur && schedules[i][j]) {
            // 不在有效范围，已规划 => 不清除，但禁掉
            Tone.Transport.clear(schedules[i][j]);
          } else {
            // 不在有效范围，未规划 => 储存，但不规划
          }
        }
      }
    },
    setupRect(i, j, sector) {
      let fill = "";
      // split NOTE_NUM_PER_SECTOR and this.NOTE_NUM_PER_SECTOR for ANIMATION!!!
      const index =
        j + (sector - 2) * NOTE_NUM_PER_SECTOR + 1 * this.NOTE_NUM_PER_SECTOR;
      const withinDur = index * TIME_PER_NOTE * 120 / this.tempo < MB_DUR;
      if (index == this.activeJ && this.rectArray[i][index]) {
        // active current note: lighter color
        fill = withinDur ? "#6477b1" : "#A9B9FF";
      } else if (index == this.activeJ && !this.rectArray[i][index]) {
        // inactive current light blue
        fill = withinDur ? "#292B3A" : "#2B2E3D";
      } else if (this.rectArray[i][index]) {
        // active non-current note
        fill = withinDur ? colors[i] : "#FF0000";
      } else {
        // incative non-current note
        fill = withinDur
          ? `rgba(0,0,0,${0.98 - i * 0.3 / this.NOTE_CATEGORY})`
          : "#FFCC33";
      }
      return {
        ...this.configNoteRect,
        x: i * this.configKonva.width / this.NOTE_CATEGORY,
        y: j * this.configKonva.height / this.ONE_PAGE_NOTE_NUM,
        fill
      };
    },
    scheduleOneNote(i, j) {
      const fullNoteNumWithinDur = Math.ceil(
        MB_DUR / (TIME_PER_NOTE * 120 / this.tempo)
      );
      if (j < fullNoteNumWithinDur) {
        schedules[i][j] = Tone.Transport.scheduleRepeat(
          time => {
            synth.triggerAttackRelease(
              Tone.Frequency(60 + musicScale[i], "midi"),
              0.5
            );
          },
          fullNoteNumWithinDur * TIME_PER_NOTE * 120 / this.tempo,
          // MB_DUR,
          j * TIME_PER_NOTE * 120 / this.tempo
        );
        console.log(`schedule ${i},${j}`, schedules[i][j]);
      } else {
        console.log("out of range");
      }
    },
    cancelOneNote(i, j) {
      console.log(`clear ${i},${j}`, schedules[i][j]);
      Tone.Transport.clear(schedules[i][j]);
      schedules[i][j] = "";
      // 分是不是活跃区域 来schedules[i][j] = ''
    },
    handleTouchRect(i, j, sector) {
      // console.log(`trigger ${i},${j+(sector-1)*this.NOTE_NUM_PER_SECTOR}`)
      // make sound
      synth.triggerAttackRelease(
        Tone.Frequency(60 + musicScale[i], "midi"),
        0.5
      );
      // this.rectArray[i][j] = !this.rectArray[i][j] // this is how to assign a two dim array in vue 2.0...
      const newRow = this.rectArray[i].slice(0);
      newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR] = !newRow[
        j + (sector - 1) * this.NOTE_NUM_PER_SECTOR
      ];
      this.$set(this.rectArray, i, newRow);
      // schedule/clearEvent
      if (newRow[j + (sector - 1) * this.NOTE_NUM_PER_SECTOR]) {
        this.scheduleOneNote(i, j + (sector - 1) * this.NOTE_NUM_PER_SECTOR);
      } else {
        this.cancelOneNote(i, j + (sector - 1) * this.NOTE_NUM_PER_SECTOR);
      }
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
          Tone.Frequency(60 + musicScale[i], "midi"),
          0.5
        );
        // operate current note view
        const newRow = this.rectArray[i].slice(0);
        newRow[fullJ] = !newRow[fullJ];
        this.$set(this.rectArray, i, newRow);

        // operate current note scheduling
        if (newRow[fullJ]) {
          // to activate the note
          this.scheduleOneNote(i, fullJ);
        } else {
          this.cancelOneNote(i, fullJ);
        }
        // restore last note view
        const newLastRow = this.rectArray[last_i].slice(0);
        newLastRow[fullLastJ] = !newLastRow[fullLastJ];
        this.$set(this.rectArray, last_i, newLastRow);
        // restore last note scheduling
        if (newLastRow[fullLastJ]) {
          this.scheduleOneNote(last_i, fullLastJ);
        } else {
          this.cancelOneNote(last_i, fullLastJ);
        }
        // update last
        last_i = i;
        last_j = j;
      } else {
        // console.log(`ignore ${i},${j}`)
      }
    },
    startloop() {
      Tone.Transport.start("+0.1");
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
      // if (this.tempo>MIN_TEMPO)
      this.tempo -= 5;
      Tone.Transport.bpm.rampTo(this.tempo, 0.1);
      //cursor_schedules arrange
      this.scheduleCursor();
      //schedules arrange (notes)
      this.scheduleAllNotes();
    },
    addTempo() {
      // if (this.tempo<MAX_TEMPO)
      this.tempo += 5;
      Tone.Transport.bpm.rampTo(this.tempo, 0.1);
      // cursor_schedules arrange
      this.scheduleCursor();
      //schedules arrange (notes)
      this.scheduleAllNotes();
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
    checkBouncibility() {
      const result = [];
      for (let i = 0; i <= this.NOTE_CATEGORY - 1; i++) {
        for (let j = 0; j <= FULL_NOTE_NUM - 1; j++) {
          if (this.rectArray[i][j]) {
            result.push({
              note: Tone.Frequency(60 + musicScale[i], "midi").toNote(),
              time: j * TIME_PER_NOTE * 120 / this.tempo
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
              note: Tone.Frequency(60 + musicScale[i], "midi").toNote(),
              time: j * TIME_PER_NOTE * 120 / this.tempo
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
            cover: "default"
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
        alert(1);
        this.bounceProject();
      } else {
        alert(2);
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
    this.setupCanvas();
    schedules = JSON.parse(JSON.stringify(this.rectArray));

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
        imgUrl: "http://oaeyej2ty.bkt.clouddn.com/Ocrg2srw_icon33@2x.png"
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
              `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(
                location.origin + location.pathname + "#/new-music-box-roll"
              )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
            );
          }
          console.log("get user info success", res.data.data);
        })
        .catch(err => {
          Cookies.remove("serviceToken");
          location.replace(
            `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(
              location.origin + location.pathname + "#/new-music-box-roll"
            )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
          );
        });
    } else {
      //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(
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
<div class="">
  <div class="roll">
    <v-stage :config="configKonva">
      <v-layer>
        <template v-for='i in NOTE_CATEGORY'>
            <v-rect v-for='j in ONE_PAGE_NOTE_NUM'
            :key="`${i}${j}`"
            @touchstart="handleTouchRect(i-1,j-1,sector)"
            @touchmove="handleMoveRect(i-1,j-1,sector)"
            :config="setupRect(i-1,j-1,sector)" />
          </template>
      </v-layer>
    </v-stage>
  </div>

  <div class="control-panal">
    <div @touchstart="scrollup" id="scrollup" class="rotate"></div>
    <div @touchstart="scrolldown" id="scrolldown"></div>
    <!-- <div @touchstart="startloop">></div>
    <div @touchstart="stoploop">口</div> -->
    <div @touchstart="minusTempo" id="minustempo" class="rotate"></div>
    <div @touchstart="addTempo" id="addtempo" class="rotate"></div>
    <div @touchstart="clearProject">x</div>
    <div class="btnContainer" @touchstart.stop.prevent="btnStart" @touchend.stop.prevent="btnEnd">
      <div :class="[playing?'pauseBtn':'playBtn', 'rotate']" @click="toggleReplay"></div>
      <div :class="[showExtendBtns?'extendBtnsShow':'extendBtnsHide','extendBtns']">
        <div class='bounceBtn rotate'></div>
        <div class='cancelBtn'></div>
      </div>
    </div>
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
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
.roll {
  position: absolute;
  right: 0;
}
.control-panal {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50px;
  height: 100%;
  top: 0;
  left: 0;
  background-color: black;
  color: white;
  #scrollup {
    width: 34px;
    height: 34px;
    background: url("../assets/left.png") center center;
    background-size: contain;
  }
  #scrolldown {
    width: 34px;
    height: 34px;
    background: url("../assets/left.png") center center;
    background-size: contain;
    transform: rotate(270deg);
  }
  #minustempo {
    width: 20px;
    height: 20px;
    background: url("../assets/minus.png") center center;
    background-size: contain;
  }
  #addtempo {
    width: 20px;
    height: 20px;
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
