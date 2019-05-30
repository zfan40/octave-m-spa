<template>
  <div class="container">
    <v-stage :config="configKonva" @touchstart="scheduleNext">
      <v-layer>
        <v-circle
          v-for="(note, index) in notes"
          :ref="`note${index}`"
          :key="index"
          :config="{
            x: calcNoteX(note.midi),
            y: -note.time * DIST_PER_SEC + OFFSET_Y,
            radius: 10,
            width: 20,
            height: 20,
            fill: 'green'
          }"
        />
      </v-layer>
    </v-stage>
    <div
      style="background-color:rgba(0,0,0,.2);position:absolute;bottom:150px;height:100%;width:100%;"
    ></div>
    <div
      style="position:absolute;width:100%;height:1px;background-color:rgba(0,0,0,.5);bottom:75px;"
    ></div>
  </div>
</template>

<script>
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
import Vue from "vue";
import VueKonva from "vue-konva";

Vue.use(VueKonva);
window.Tone = require("tone");
let tweens = [];
const windowWidth = document.documentElement.getBoundingClientRect().width;
let lastTouchTime = 0;
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

export default {
  name: "hello",
  data() {
    return {
      notes: [],
      msg: "Welcome to Your Vue.js App",
      OFFSET_Y: window.innerHeight - 150 + 75, //底部150px的操作区域
      DIST_PER_SEC: 200,
      step: -1, // will go till length of notes
      actualInterval: 0 // touch interval
    };
  },
  methods: {
    async getNotes() {
      const self = this;
      this.notes = await Magic.fetchNotesFromUrl();
      console.log(this.notes);
      this.$nextTick(() => {
        this.noteNodes = this.notes.map((note, index) =>
          self.$refs[`note${index}`][0].getStage()
        );
      });
    },
    makeSound(note) {
      console.log(note.midi);
      piano.triggerAttackRelease(Tone.Frequency(note.midi, "midi"), 0.25);
    },
    scheduleNext() {
      //TODO: 双音处理，从midi数据那就需要洗数据吧
      // duration:interval要考虑当前速度变化

      this.step += 1;
      let desiredInterval;
      const now = window.performance.now();
      this.actualInterval = now - lastTouchTime;
      lastTouchTime = now;
      if (this.step >= 1) {
        this.makeSound(this.notes[this.step - 1]);
        if (this.step < this.notes.length) {
          console.log(this.step);
          desiredInterval =
            this.notes[this.step].time - this.notes[this.step - 1].time;
          console.log(11111);
          console.log(desiredInterval);
        }
      } else {
        // first note
        desiredInterval = this.notes[this.step].time;
      }
      tweens.forEach(tween => {
        tween.pause();
        tween.finish();
        // tween.destroy();
      });
      tweens = this.noteNodes.map(
        noteNode =>
          new Konva.Tween({
            node: noteNode,
            offsetY: -(this.DIST_PER_SEC * this.notes[this.step].time),
            duration: desiredInterval
            // easing: Konva.Easings.EaseInOut
          })
      );
      tweens.forEach(tween => tween.play());
    },
    redirectTo(path) {
      this.$router.push(path);
    },
    moveEvery() {},
    setupCanvas() {
      const docElem = document.documentElement;
      this.configKonva = {
        width: docElem.getBoundingClientRect().width,
        height: window.innerHeight
      };
    },
    calcNoteX(midi) {
      return Magic.linearMap(midi, [47, 86], [0, windowWidth]);
    }
  },
  created() {
    this.setupCanvas();
    this.getNotes();
  },
  mounted() {}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
@import "./MagicPiano.scss";
</style>
