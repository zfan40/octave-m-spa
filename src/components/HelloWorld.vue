<template>
  <div class="app">
    <div class="m-logo"></div>
    <div class="redirect-button" id="mb-maker" @touchstart="redirectTo('/new-music-box-maker')">
        去编曲
    </div>
  </div>
</template>

<script>
import * as Util from '../_common/js/util';
import * as Api from '../_common/js/api';
import * as Cookies from 'js-cookie';
export default {
  name: 'hello',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  methods: {
    redirectTo(path) {
      // IMPORTANT keng. 从主页跳制作页，如果相对路径会带上参数，比如auth回来的code会一直带着，污染之后的auth
      // 成功auth一次，就写入cookie了，所以往后跳就直接给全路径，摒弃微信弄回来的乱七八糟的参数
      this.$router.push(path);
    },
  },
  created() {
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + 'px';

    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) return;
    if (Util.getUrlParam('code') || Cookies.get('serviceToken')) {
      //TODO:ajax call to get info
      Api.getUserInfo(Util.getUrlParam('code'))
        .then(res => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove('serviceToken');
            location.replace(
              'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect',
            );
          }
          alert(`welcome${res.data.data.realname}`);
          console.log('get user info success', res.data.data);
        })
        .catch(err => {
          Cookies.remove('serviceToken');
          location.replace(
            'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect',
          );
        });
    } else {
      //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect',
      );
    }
  },
};

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
@import '../_common/style/_functions.scss';
@import '../_common/style/_variables.scss';
@import '../_common/style/_mixins.scss';
@import '../_common/style/_reboot.scss';
* {
  box-sizing: border-box;
  margin:0;
  padding:0;
}
.app {

  background-color: black;
}
.m-logo {
  position: absolute;
  width: getRem(200);
  height: getRem(200);
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  background:url('//gw.alicdn.com/tps/TB1pfhUOFXXXXaSaXXXXXXXXXXX-350-350.png') no-repeat center center;
  background-size: getRem(175) getRem(175);
  background-color: #ffcc33;
  border-radius: getRem(25);
  animation: toupperleftwithsize 4.5s linear;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
  z-index: 2
}
.redirect-button {
  width:getRem(450);
  height: getRem(100);
  padding: getRem(20) getRem(50);
  background-color: #ffcc33;
  border-radius:getRem(10);
  color: gray;
}
.redirect-button,#mb-maker {
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size:.57rem;
}
</style>
