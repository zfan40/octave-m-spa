<script>
window.Tone = require('tone')
import * as Util from '../_common/js/util'
import * as Api from '../_common/js/api'
import * as Cookies from "js-cookie"
import * as Magic from '../_common/js/magic'

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
  'baseUrl': 'static/audio/'
}).toMaster()

var mbox = new Tone.Sampler({
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
  'baseUrl': 'static/audio/'
}).toMaster()

var plucky = new Tone.PluckSynth().toMaster()
// var part = new Tone.Part(function(time, value){
// 	//the value is an object which contains both the note and the velocity
// piano.triggerAttackRelease(value.note, "8n", time)
// }, [{"time" : 1.9, "note" : "C3"},
// 	   {"time" : 2, "note" : "C4"},
//      {"time" : 3, "note" : "C3"},
//      	   {"time" : 4, "note" : "C4"}
// ]).start(0)
// Tone.Transport.start()

window.recorder = [] //Tone.Part => schedule notes

window.tonepart = [] // store all the music parts. (ummm,that's why it's named part...)
let bouncepart = []
var timeline = 0
export default {
  data() {
    return {
      activeNote: {},
      timerToStartRecord: 0,
      recording: false,
      replaying: false,
    }
  },
  methods: {
    load() {},
    startRecord() {
      this.timerToStartRecord = 3
      let timer = setInterval(() => {
        this.timerToStartRecord -= 1
        if (this.timerToStartRecord == 0) {
          clearInterval(timer)
        }
      }, 1000)
    },
    touchStartHandler: function(e) {
      console.log('down', e.target.id)
      piano.triggerAttack(e.target.id)
      this.$set(this.activeNote, e.target.id, 1)
      if (this.recording) {
        recorder.push({
          'note': e.target.id,
          'time': +((performance.now() - timeline) / 1000).toFixed(4)
        })
      }
    },
    touchEndHandler: function(e) {
      // console.log('up',e.target.id)
      piano.triggerRelease(e.target.id)
      // plucky.triggerRelease(e.target.id)
      this.$set(this.activeNote, e.target.id, 0)
    },
    toggleRecord(e) {
      this.recording = !this.recording
      if (this.recording) {
        //start recording
        recorder = []
        if (!this.replaying) {
          this.timerToStartRecord = 3
          let timer = setInterval(() => {
            this.timerToStartRecord -= 1
            if (this.timerToStartRecord == 0) {
              clearInterval(timer)
              timeline = performance.now()
            }
          }, 1000)

          // timeline = performance.now()
          // 1. e.timestamp behave not consistent
          // 2. if currently playing, follow that timeline
        }

        try {
          // tonepart.dispose()//此处必须dispose，否则会一直往part里面加
        } catch (e) {
          console.warn('tone cannot be disposed')
        }
      } else {
        //stop recording
        console.log('kikikiki')
        if (recorder.length) {
          tonepart[tonepart.length] = new Tone.Part(function(time, value) { //不能老这new啊，要每次一个数组，每次改动最后一个
            piano.triggerAttackRelease(value.note, "8n", time)
          }, recorder).start(0)
        }
      }
    },
    toggleReplay() {
      console.log(1)
      this.replaying = !this.replaying
      if (this.replaying) {
        console.log('kokokoko')
        timeline = performance.now();
        Tone.Transport.start("+0.01") // in case < context.currentTime
      } else {
        Tone.Transport.stop(0) // TODO：必须stop才能start。。。有没有自动stop啊..
      }
    },
    undoRecord() {
      //TODO:可以改造为选择哪个进行删除
      // tonepart[tonepart.length-1].dispose() //dispose是一个part被dispose
      //TODO:若tonepart里只有一个，应让用户确认是否继续操作
      // TODO: 如果tonepart里没东西，undo按钮应该grayout

      tonepart.pop().dispose() //最后一个被dispose，同时要从数组中删掉
      // Tone.Transport.clear(tonepart);
    },
    bounceProject() {
      console.log(tonepart)
      bouncepart = []
      if (tonepart.length) {
        tonepart.forEach(item => {
          item._events.forEach(noteInfo => {
            bouncepart.push(noteInfo.value)
          })
        })
        while (tonepart.length) {
          tonepart.pop().dispose() //最后一个被dispose，同时要从数组中删掉
        }
        tonepart[0] = new Tone.Part(function(time, value) { //不能老这new啊，要每次一个数组，每次改动最后一个
          piano.triggerAttackRelease(value.note, "8n", time)
        }, bouncepart).start(0)

        bouncepart.sort((a, b) => (0 + a.time - b.time))
        console.log(bouncepart)
        Magic.generateJSCadCode(bouncepart)
      } else {
        alert('tm什么都没录')
      }
    },
  },
  created() {
    //check cookie to get serviceToken first
    // if stoken not exist, go auth
    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase())

    //test magic.js
    // const work = [{note: "E4", time: 0.14585000000000037},
    // {note: "G4", time: 1.0295},
    // {note: "G4", time: 1.3985},
    // {note: "E4", time: 2.6605300000000005},
    // {note: "D4", time: 3.4207450000000006},
    // {note: "C4", time: 4.196245000000001},
    // {note: "G4", time: 2.671395000000004},
    // {note: "A4", time: 3.35932},
    // {note: "B4", time: 4.183044999999998}]
    //
    // Magic.generateJSCadCode(work)


    if (!inWechat) return
    if (Util.getUrlParam('code') || Cookies.get('serviceToken')) {
      //TODO:ajax call to get info
      Api.getUserInfo(Util.getUrlParam('code'))
        .then((res) => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove('serviceToken')
            location.replace(
              'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
            )
          }
          alert(`welcome${res.data.data.realname}`)
          console.log('get user info success', res.data.data)
        })
        .catch((err) => {
          Cookies.remove('serviceToken')
          location.replace(
            'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
          )
        })
    } else { //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box-maker&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box-maker&connect_redirect=1#wechat_redirect'
      )
    }
  },
  mounted() {
    // this.startRecord();
  },
  updated() {}
};
</script>

<template>
<div id="app">
  <div :class="['mask', timerToStartRecord>1?'fadein':'fadeout', timerToStartRecord==0?'hide':'']">
    <p id="timer" class="rotate">{{timerToStartRecord}}</p>
  </div>
  <div class="container">
    <!-- all the kays -->
    <div class="keys" @touchstart.stop.prevent="touchStartHandler" @touchend.stop.event="touchEndHandler">
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
    </div>
    <!-- the controller panal -->
    <div class="controller">
      <div class="funcBtn record" :class="recording?'active':''" @click="toggleRecord">
        <div class="recordHint"></div>
      </div>
      <div class="funcBtn play" :class="replaying?'active':''" @click="toggleReplay">
        <div :class="['rotate',replaying?'playHint':'stopHint']"></div>
      </div>
      <div class="funcBtn undo" @click="undoRecord">
        <div class="undoHint rotate"></div>
      </div>
      <div class="funcBtn bounce" @click="bounceProject">
        <div class="bounceHint rotate"></div>
      </div>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import '../_common/style/_functions.scss';
@import '../_common/style/_variables.scss';
@import '../_common/style/_mixins.scss';

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
    /* position: absolute;  make whole keys appear */
    /* height: 100%; */
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    float: left;
    /* padding-right:getRem(347); */
    box-sizing: border-box;
}

.controller {
    background: linear-gradient(90deg, #434343 0%, #212121 100%);
    width: getRem(350);
    right: 0;
    height: 100%;
    position: fixed;
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

.progressBar {
    position: fixed;
    width: getRem(750);
}

/* piano keyboard layout css  */

.white {
    width: getRem(400);
    height: getRem(100);
    z-index: 1;
    border-left: 1px solid #bbb;
    border-bottom: 1px solid #bbb;
    border-radius: 0 0 5px 5px;
    box-shadow: -1px 0 0 rgba(255, 255, 255, 0.8) inset, 0 0 5px #ccc inset, 0 0 3px rgba(0, 0, 0, 0.2);
    background: linear-gradient(top, #eee 0%, #fff 100%);
    &.active-note {
        box-shadow: 2px 0 3px rgba(0, 0, 0, 0.1) inset, -5px 5px 20px rgba(0, 0, 0, 0.2) inset, 0 0 3px rgba(0, 0, 0, 0.2);
        background: linear-gradient(top, #fff 0%, #e9e9e9 100%);
    }
}

.black {
    position: relative;
    width: getRem(200);
    height: getRem(50);
    margin-top: getRem(-25);
    top: getRem(25);
    z-index: 2;
    border: 1px solid #000;
    border-radius: 0 0 3px 3px;
    box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset, 0 -5px 2px 3px rgba(0, 0, 0, 0.6) inset, 0 2px 4px rgba(0, 0, 0, 0.5);
    background: linear-gradient(45deg, #222 0%, #555 100%);
    &.active-note {
        box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset, 0 -2px 2px 3px rgba(0, 0, 0, 0.6) inset, 0 1px 2px rgba(0, 0, 0, 0.5);
        background: linear-gradient(left, #444 0%, #222 100%);
    }
}

.a,
.c,
.d,
.f,
.g {
    margin-bottom: getRem(-25);
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
