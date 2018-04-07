<script>
// window.Tone = require('tone')
import * as Util from '../_common/js/util'
import * as Api from '../_common/js/api'
import * as Cookies from "js-cookie"
import * as Magic from '../_common/js/magic'
import countButton from './common/countButton'
import * as WxShare from '../_common/js/wx_share'
let musicPart = undefined

export default {
  components: {
    countButton,
  },
  data() {
    return {
      searching: false,
      loading: false,
      recommendations: {},
    }
  },
  computed: {

  },
  methods: {
    load() {
      Api.getRecommendations().then((res)=>{console.log('index:',res)})
    },
    search() {

    },
  },
  beforeRouteLeave (to, from, next) {
    Magic.clearTone()
    next()
  },
  created() {
    //check cookie to get serviceToken first
    // if stoken not exist, go auth
    const self = this
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + 'px';


    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase())
    if (!inWechat) {
       self.loadMusicById()
       return
     }
    const fullPath = `${location.origin}${location.pathname}#/new-music-box-viewer?id=${self.$store.state.route.query.id}`
    WxShare.prepareShareConfig().then(()=>{
      WxShare.prepareShareContent({
        title:'MUSIXISE',
        desc:'分享一个八音盒',
        // fullPath:location.href.split('#')[0],
        fullPath,
        imgUrl:'http://oaeyej2ty.bkt.clouddn.com/Ocrg2srw_icon33@2x.png',
      })
    })
    // alert(Cookies.get('serviceToken'))
    if (Util.getUrlParam('code') || Cookies.get('serviceToken')) {
      //TODO:ajax call to get info
      Api.getUserInfo(Util.getUrlParam('code'))
        .then((res) => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove('serviceToken')
            location.replace(
              // will publish to node project m-musixise, under '/music-box' path
              `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(fullPath)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
            )
          }
          self.userId = res.data.data.userId
          // alert(`welcome${res.data.data.realname}`)
          // if (!this.project) {
            self.loadMusicById()
          // }

          console.log('get user info success', res.data.data)
        })
        .catch((err) => {
          Cookies.remove('serviceToken')
          location.replace(
            `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(fullPath)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
          )
        })
    } else { //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${encodeURIComponent(fullPath)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
      )
    }
  },
  mounted() {
    // this.startRecord();
    setTimeout(()=>{this.loading = false},2000)
    setTimeout(()=>{this.workIntroAppear = true;},4500)
    setTimeout(()=>{this.controlPanalAppear = true},5500)
    // setTimeout(()=>{this.playing = true},6000)
  },
  updated() {}
};
</script>

<template>
<div :class="['container', loading?'loading':'']">
  <div id="ground"></div>
  <div id="spirit">
    <div class="spirit-part" id="spirit-body"></div>
    <div class="spirit-part" id="spirit-front-leaf"></div>
    <div class="spirit-part" id="spirit-back-leaf"></div>
    <div class="spirit-part" id="spirit-back1"></div>
    <div class="spirit-part" id="spirit-back2"></div>
  </div>
  <div id="mb" @click="togglePlay">
    <div :class="['mb-part', playing?'playing':'']" id="mb-lid"></div>
    <div class="mb-part" id="mb-body">
      <div id="play-btn" v-show="!playing"></div>
      <div id="pause-btn" v-show="playing"></div>
    </div>
  </div>
  <transition name="fade">
    <div id="music-aurora" v-show="playing"></div>
  </transition>
  <div id="low-leaf1"></div>
  <div id="low-leaf2"></div>
  <div id="low-leaf3"></div>
  <div id="low-leaf4"></div>
  <div id="mid-leaf1"></div>
  <div id="mid-leaf2"></div>
  <div id="mid-leaf3"></div>
  <div id="mid-leaf4"></div>
  <div id="top-leaf1"></div>
  <div id="top-leaf2"></div>
  <div id="top-leaf3"></div>
  <div id="top-leaf4"></div>
  <div id="top-leaf5"></div>
  <div id="top-leaf6"></div>
  <transition name="bounce">
    <div id="work-intro" v-if="workIntroAppear">
      <div class="title">{{finalNewWorkTitle||projectInfo.title}}</div>
      <div class="subtitle"><span>by</span> <span><img :src="projectInfo.owner.smallAvatar" alt=""></span><span>{{projectInfo.owner.nickName}}</span></div>
      <div v-if="userId === projectInfo.userId" id="edit-work" @click="titleUpdateAppear=true"></div>
    </div>
  </transition>
  <transition name="bounce">
    <div id="control-panal" v-if="controlPanalAppear">
      <!-- <div class="likeBtn">
        <div class="active">
          <div class=""></div>
          <p>1</p>
        </div>
        <div class="inactive">
          <div class=""></div>
          <p>0</p>
        </div>
      </div> -->
      <count-button :initCount="projectInfo.collectNum?projectInfo.collectNum:0" :initActive="projectInfo.favStatus?true:false" iconImg="" :onClickCall="toggleFav" />
      <div class="purchaseBtn" @click="purchaseItem">购买</div>
      <div class="makeBtn" @click="redirectToMaker">编曲</div>
    </div>
  </transition>
  <transition name="fade">
    <div id="title-update-mask" v-show="titleUpdateAppear">
      <div class="mb-dialog">
        <div class="title">
          作品名称
        </div>
        <div class="input">
          <input v-model="newWorkTitle" type="text" placeholder="作品新名称">
          <div class="splitter"></div>
        </div>
        <div class="btns">
          <span class="btn cancel" @click="titleUpdateAppear=false">取消</span>
          <span class="btn confirm" @click="updateWorkTitle">确认</span>
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
.container {
    position: absolute;
    width: 100%;
    height: 100%;
    display:flex;
    flex-direction: column;
    overflow:hidden;
    #spirit {
      will-change: transform;
      transition: transform 4.5s ease-out;
      transform:translateY(0);
      position: absolute;bottom:5rem;width: 9.8rem; height: 7.8rem; margin-left: .2rem;
      .spirit-part {position: absolute;}
      #spirit-body {z-index:4;left:getRem(220);top:getRem(136);width: getRem(266);height:getRem(368);background: url('../assets/viewer/spirit-body.png') center center no-repeat;background-size:cover;}
      #spirit-front-leaf {z-index:5;left:getRem(340);top:getRem(12);width: getRem(398);height:getRem(492);background: url('../assets/viewer/spirit-front-leaf.png') center center no-repeat;background-size:cover;}
      #spirit-back-leaf {z-index:3;width: getRem(462);height:getRem(472);background: url('../assets/viewer/spirit-back-leaf.png') center center no-repeat;background-size:cover;}
      #spirit-back1 {z-index:1;left:getRem(40);top:getRem(16);opacity:.6;width: getRem(618);height:getRem(526);background: url('../assets/viewer/spirit-back1.png') center center no-repeat;background-size:cover;}
      #spirit-back2 {z-index:2;transform:rotate(-14deg);opacity: .3;width: getRem(754);height:getRem(580);background: url('../assets/viewer/spirit-back2.png') center center no-repeat;background-size:cover;}
    }
    #mb {
      will-change: transform;
      transition: transform 4.5s ease-out;
      transform:translateY(0);
      position: absolute;bottom:4.2rem;width: 1.4rem; height: 1.6rem; left: 2.4rem;
      .mb-part {position: absolute;}
      #mb-lid {z-index:2;left:getRem(0);top:getRem(0);transition: .5s ease-out;transform:rotate(54deg);width: getRem(48);height:getRem(64);background: url('../assets/viewer/mb-lid.png') center center no-repeat;background-size:cover;}
      #mb-lid.playing {transform:rotate(0deg) translateX(-.3rem);}
      #mb-body {
        display:flex;align-items: center;justify-content: center;z-index:1;left:getRem(20);top:getRem(50);width: getRem(64);height:getRem(52);background: url('../assets/viewer/mb-body.png') center center no-repeat;background-size:cover;
        #play-btn {position: relative;margin-top:.3rem;margin-left:.1rem;width: getRem(12);height:getRem(16);background: url('../assets/viewer/audio-play.png') center center no-repeat;background-size:cover;}
        #pause-btn {position: relative;margin-top:.3rem;margin-left:.05rem;width: getRem(16);height:getRem(14);background: url('../assets/viewer/audio-pause.png') center center no-repeat;background-size:cover;}
      }
    }
    #music-aurora {
      position: absolute;
      bottom: 4.2rem;
      left:1.5rem;
      width: getRem(577);
      height: getRem(577);
      background: url('../assets/viewer/music_sprite.png'); // background:url('http://c.m.163.com/nc/qa/activity/xijing/img/cover_tit_step2.png');
      background-size: getRem(577) getRem(4039);
      animation: music-aurora steps(7) 1.5s infinite;
      pointer-events: none;
    }
    #ground {
      will-change: transform;
      transition: transform 4.5s ease-out;
      position: absolute;left:-3rem;bottom:-2.3rem;opacity: .4;width: getRem(1522);height:getRem(852);background: url('../assets/viewer/ground.png') center center no-repeat;background-size:cover;
    }
    #low-leaf1 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(162);height: getRem(168);opacity: .38;left:getRem(-160);bottom:6.5rem;background: url('../assets/viewer/low-leaf1.png') center center no-repeat;background-size:cover;}
    #low-leaf2 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(250);height: getRem(300);left:getRem(-106);bottom:2rem;background: url('../assets/viewer/low-leaf2.png') center center no-repeat;background-size:cover;}
    #low-leaf3 {z-index:-1;will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(162);height: getRem(365);left:4rem;bottom:8.5rem;background: url('../assets/viewer/low-leaf3.png') center center no-repeat;background-size:cover;}
    #low-leaf4 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(310);height: getRem(336);transform:rotate(-23deg);right:-3.5rem;bottom:getRem(400);background: url('../assets/viewer/low-leaf4.png') center center no-repeat;background-size:cover;}
    #mid-leaf1 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(557);height: getRem(419);transform:rotate(-10deg);left:-3rem;bottom:getRem(940);background: url('../assets/viewer/mid-leaf1.png') center center no-repeat;background-size:cover;}
    #mid-leaf2 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(359);height: getRem(415);transform:rotate(-21deg);left:-2.8rem;bottom:getRem(840);background: url('../assets/viewer/mid-leaf2.png') center center no-repeat;background-size:cover;}
    #mid-leaf3 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(583);height: getRem(546);right:-4.2rem;transform:rotate(33deg);bottom:getRem(820);background: url('../assets/viewer/mid-leaf3.png') center center no-repeat;background-size:cover;}
    #mid-leaf4 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(384);height: getRem(537);right:-2.6rem;transform:rotate(25deg);bottom:getRem(740);background: url('../assets/viewer/mid-leaf4.png') center center no-repeat;background-size:cover;}
    #top-leaf1 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(1226);height: getRem(1232);transform:rotate(56deg) scale(1);right: -10rem;bottom:getRem(1700);background: url('../assets/viewer/top-leaf1.png') center center no-repeat;background-size:cover;}
    #top-leaf2 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(1430);height: getRem(874);opacity: .9;transform:rotate(-6deg) scale(.7);right: -10rem;bottom:getRem(1200);background: url('../assets/viewer/top-leaf2.png') center center no-repeat;background-size:cover;}
    #top-leaf3 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(1250);height: getRem(986);transform:rotate(-2deg) scale(.7);left:-7rem;bottom:getRem(1870);background: url('../assets/viewer/top-leaf3.png') center center no-repeat;background-size:cover;}
    #top-leaf4 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(918);height: getRem(752);transform:rotate(44deg) scale(.8);left:-9.5rem;bottom:getRem(1270);background: url('../assets/viewer/top-leaf4.png') center center no-repeat;background-size:cover;}
    #top-leaf5 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(1048);height: getRem(1054);opacity: .3;transform:rotate(22deg) scale(.9);right:-12rem;bottom:getRem(1500);background: url('../assets/viewer/top-leaf1.png') center center no-repeat;background-size:cover;}
    #top-leaf6 {will-change: transform;transition: transform 4.5s ease-out,opacity 4.5s ease-out;position: absolute;width: getRem(718);height: getRem(566);opacity: .5;transform:rotate(-1deg) scale(1.2);left:-6rem;bottom:getRem(1700);background: url('../assets/viewer/top-leaf5.png') center center no-repeat;background-size:cover;}
    #work-intro {
      position: absolute;bottom:3.4rem;text-align: right;right:1rem;
      .title{font-size:.6rem;margin-bottom:.3rem;color:#7d839e;}
      .subtitle {
        display:flex;
        height:getRem(60);
        font-size:.4rem;
        align-items:center;
        color:#7d839e;
        img {width: getRem(60);height:getRem(60);border-radius: 50%;border:none;margin:0 .3rem 0 .3rem;}
      }
      #edit-work {
        position: absolute;width: getRem(28);height: getRem(28);right: getRem(-34);top:getRem(18);background: url('../assets/viewer/edit.svg') center center no-repeat;background-size:cover;
      }
    }
    #control-panal {
      position: absolute; width: 100%; bottom:0rem; display: flex;height:2.4rem;padding: 0 getRem(50);justify-content: space-between;align-items: center;
      .purchaseBtn{position: relative;width: getRem(250);height: getRem(92);border:none;border-radius:getRem(46);background-color:#4266F5;font-size:.47rem;color:white;text-align: center;line-height: getRem(92);}
      .makeBtn{position: relative;width: getRem(250);height: getRem(92);border:none;border-radius:getRem(46);background-color:#4266F5;font-size:.47rem;color:white;text-align: center;line-height: getRem(92);}
    }
    #playBtn {
      width: 2rem;
      height: 2rem;
      background-color:pink;
    }
}
.loading {
  #spirit {
    transition: none;
    transform:translateY(13rem) scale(.85);
  }
  #mb {
    transition: none;
    transform:translateY(13rem);
  }
  #ground {
    transition: none;transform:translateY(13rem);
  }
  #low-leaf1 {transition: none;transform:translateY(13rem);opacity:1}
  #low-leaf2 {transition: none;transform:translateY(13rem) translateX(2rem);}
  #low-leaf3 {transition: none;transform:translateY(13rem);}
  #low-leaf4 {transition: none;transform:translateY(13rem) rotate(0deg);}
  #mid-leaf1 {transition: none;transform:translateY(12rem) rotate(9deg) scale(0.9);opacity:.9;}
  #mid-leaf2 {transition: none;transform:translateY(14rem) translateX(1.8rem) rotate(-8deg) scale(0.9);opacity:.8;}
  #mid-leaf3 {transition: none;transform:translateY(14rem) rotate(8deg) scale(0.9);opacity:.8;}
  #mid-leaf4 {transition: none;transform:translateY(14rem) rotate(0deg) scale(0.9);opacity:.8;}
  #top-leaf1 {transition: none;transform:translateY(16.5rem) rotate(35deg) scale(0.7);opacity:1;}
  #top-leaf2 {transition: none;transform:translateY(14.5rem) translateX(-1rem) rotate(-20deg) scale(0.6);opacity:.9;}
  #top-leaf3 {transition: none;transform:translateY(15rem) translateX(1rem) rotate(13deg) scale(0.6);opacity:.95;}
  #top-leaf4 {transition: none;transform:translateY(13rem) translateX(4.5rem) rotate(52deg) scale(0.7);opacity:1;}
  #top-leaf5 {transition: none;transform:translateY(18rem) translateX(-5rem) rotate(12deg) scale(0.7);opacity:.3;}
  #top-leaf6 {transition: none;transform:translateY(14.5rem) translateX(2.5rem) rotate(39deg) scale(1);opacity:.5;}
}
.bounce-enter-active {
  transition: all 2s cubic-bezier(.19,2,.32,.91);;
}
.bounce-leave-active {
  transition: all .8s cubic-bezier(.19,1.58,.42,.91);
}
.bounce-enter, .bounce-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateY(3rem);
  opacity: 0;
}
.fade-enter-active {
  transition: all .3s ease-out;
}
.fade-leave-active {
  transition: all .3s ease-out;
}
.fade-enter, .fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
@keyframes music-aurora {
  0% {
    background-position: 0 0;
  }
  // 50% {
  //   background-position: 0 getRem(-4039); // background-position: 0 -97.7%
  //   // background-position: 0 getRem(-1590); // background-position: 0 -97.7%
  // }
  100% {
    background-position: 0 getRem(-4039); // background-position: 0 -97.7%
  }
}
#title-update-mask {
  position: absolute;width:100%;height:100%;background-color:rgba(0,0,0,.3);display: flex;align-items: center;justify-content: center;
  .mb-dialog {
    position: relative;width: getRem(570);padding-top:getRem(75); border-radius:getRem(50);height:getRem(344);background-color:rgba(255,255,255,.96);display:flex;flex-direction:column;
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
