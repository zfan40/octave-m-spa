<script>
// window.Tone = require('tone')
import * as Util from '../_common/js/util'
import * as Api from '../_common/js/api'
import * as Cookies from "js-cookie"
import * as Magic from '../_common/js/magic'
import countButton from './common/countButton'
import * as WxShare from '../_common/js/wx_share'
import infiniteScroll from 'vue-infinite-scroll'

let musicPart = undefined

export default {
  directives: {
    infiniteScroll,
  },
  components: {
    countButton,
  },
  data() {
    return {
      // playing: false,
      loading: true,
      playing: false,
      userId: 0,
      isMe: false,
      favStatus: false,
      newWorkTitle: '',
      finalNewWorkTitle: '',
      busy: true,
    }
  },
  computed: {
    favWorksObj() {
      return this.$store.state.favWorksObj
    }
  },
  methods: {
    loadFavWorks() {
      // console.log('my id: ', this.userId)
      // const id = this.userId
      // this.$store.dispatch('FETCH_FAV_WORKS', {
      //   id,
      //   page:1
      // })
      this.busy = false;
    },
    loadMore() { //will call automatically when enter!
      const id = this.userId
      this.busy = true
      alert('1111111')
      this.$store.dispatch('FETCH_FAV_WORKS', {
        id,
        page: this.favWorksObj.current ? this.favWorksObj.current + 1 : 1
      }).then(() => {
        alert(222)
        if (this.favWorksObj.content.length < this.favWorksObj.total) {
          this.busy = false
        }
      })
    },
    togglePlay() {
      // alert('111')
      Magic.preview(this.project)
      this.playing = !this.playing;
    },
    toggleFav() {
      // this.favStatus = +!this.favStatus;
      Api.toggleFavSong({
        workId: this.$store.state.route.query.id,
        status: this.favStatus,
      })
    },
    redirectToWork(id) {
      this.$router.push({
        path:'/new-music-box-viewer',
        query:{
          id
        }
      })
    },
  },
  beforeRouteLeave(to, from, next) {
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
      this.userId = this.$store.state.route.query.id || 149
      self.loadMusixiserById()
      return
    }
    const fullPath = `${location.origin}${location.pathname}#/new-music-box-viewer?id=${self.$store.state.route.query.id}`
    WxShare.prepareShareConfig().then(() => {
      WxShare.prepareShareContent({
        title: 'MUSIXISE',
        desc: '我的最爱',
        // fullPath:location.href.split('#')[0],
        fullPath,
        imgUrl: 'http://oaeyej2ty.bkt.clouddn.com/Ocrg2srw_icon33@2x.png',
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
          self.userId = this.$store.state.route.query.id || res.data.data.userId
          self.isMe = self.userId == res.data.data.userId
          self.loadFavWorks()
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
    setTimeout(() => {
      this.loading = false
    }, 2000)
    // setTimeout(()=>{this.playing = true},6000)
  },
  updated() {}
};
</script>

<template>
<div class="">
  <div class="">
    my fav
  </div>
  <div class="" v-infinite-scroll="loadMore" infinite-scroll-disabled="busy" infinite-scroll-distance="10">
    <ul id="example-1">
      <li v-for="item in favWorksObj.content" @click="redirectToWork(item.id)">
        {{ item.title }}
      </li>
    </ul>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import '../_common/style/_functions.scss';
@import '../_common/style/_variables.scss';
@import '../_common/style/_mixins.scss';
@import '../_common/style/_reboot.scss';
.container {}
</style>
