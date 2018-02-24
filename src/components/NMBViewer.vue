<script>
window.Tone = require('tone')
import * as Util from '../_common/js/util'
import * as Api from '../_common/js/api'
import * as Cookies from "js-cookie"
import * as Magic from '../_common/js/magic'
let musicPart = undefined

const mbox = new Tone.Sampler({
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

export default {
  components: {

  },
  data() {
    return {
      // playing: false,
    }
  },
  computed: {
    project() {
      return this.$store.state.recordProject
    },
    projectInfo() {
      return this.$store.state.recordProjectInfo
    },
  },
  methods: {
    load() {},
    loadMusicById() {
      console.log('hehe', this.$store.state)
      const {id} = this.$store.state.route.query
      if(id){ //从id取作品
        console.log('mmm',id)
        this.$store.dispatch('FETCH_MBOX',{id}).then(() => {
          console.log('workPart',this.project)
          console.log('work info',this.projectInfo)
          alert('load complete');
          this.togglePlay();
        })
      } else {
        // 不会出现这个情况
        this.$store.dispatch('FETCH_MBOX',{id:50}).then(() => {
          console.log('workPart',this.project)
          console.log('work info',this.projectInfo)
          alert('load complete');
          this.togglePlay();
        })
      }
    },
    togglePlay() {
      // alert('111')
      Magic.preview(this.project)
    },
  },

  created() {
    //check cookie to get serviceToken first
    // if stoken not exist, go auth
    const self = this
    self.loadMusicById()
    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase())
    if (!inWechat) return
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
              `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
            )
          }
          alert(`welcome${res.data.data.realname}`)
          if (!this.project) {
            self.loadMusicById()
          }

          console.log('get user info success', res.data.data)
        })
        .catch((err) => {
          Cookies.remove('serviceToken')
          location.replace(
            `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
          )
        })
    } else { //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2cb950ff65a142c5&redirect_uri=${location.href}&response_type=code&scope=snsapi_userinfo&state=type&quan,url=${location.href}&connect_redirect=1#wechat_redirect`
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
<div id="container">
  <div class="mb">
    <div id="playBtn" @touchstart="togglePlay"></div>
  </div>
  <div class="operate">
    <div class="share">

    </div>
    <div class="purchase">

    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import '../_common/style/_functions.scss';
@import '../_common/style/_variables.scss';
@import '../_common/style/_mixins.scss';
@import '../_common/style/_reboot.scss';
#container {
    position: absolute;
    width: 100%;
    height: 100%;
    display:flex;
    flex-direction: column;
    #playBtn {
      width: 2rem;
      height: 2rem;
      background-color:pink;
    }
}
</style>
