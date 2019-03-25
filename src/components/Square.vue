<script>
import Card from "./common/BigCard";
import { swiper, swiperSlide } from "vue-awesome-swiper";
/**
 * 首页 component
 * 业务逻辑， 左滑动下一个， 右滑动点赞下一个， 双击点赞，点击中间播放， 点击下面按钮 （编曲页面 | 购买页面）
 *
 */
export default {
  name: "Square",
  components: {
    Card,
    swiper,
    swiperSlide
  },
  data() {
    return {
      cards: [], //to be commented
      userId: 0,
      bigCardListOption: [],
      activeIndex: 0
    };
  },
  computed: {
    musixiserWorksObj() {
      return this.$store.state.musixiserWorksObj;
    },
    // operatingWorkId() {
    //   return this.$store.state.operatingWorkId;
    // },
    // playingWorkId() {
    //   return this.$store.state.playingWorkId;
    // },
    bigSwiper() {
      return this.$refs.bigCardList.swiper;
    }
  },
  methods: {
    playWork() {},
    loadWorks() {
      console.log("my id: ", this.userId);
      const id = this.userId; // this.userId手传参id或当前用户id
      this.$store
        .dispatch("FETCH_WORKS_FROM_MUSIXISER", {
          id,
          page: this.musixiserWorksObj.current
            ? this.musixiserWorksObj.current + 1
            : 1
        })
        .then(() => {
          console.log("2222222", this.musixiserWorksObj);
          if (
            +this.musixiserWorksObj.content.length <
            +this.musixiserWorksObj.total
          ) {
            //otherwise no more content
            this.busy = false;
          }
        });
    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone();
    next();
  },
  created() {
    const self = this;

    this.bigCardListOption = {
      loop: false,
      // spaceBetween: 30,
      centeredSlides: true,
      slidesPerView: 1,
      // slidesPerView: "auto",
      watchSlidesProgress: true,
      on: {
        transitionEnd(e) {
          // console.log(this.realIndex);
          self.targetProduct = self.musixiserWorksObj.content[this.realIndex];
          self.activeIndex = this.realIndex;
        },
        progress(progress) {
          // this.activeIndex = progress;
          // console.log()
        }
      }
    };
    //check cookie to get serviceToken first
    // if stoken not exist, go auth
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + "px";

    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) {
      this.userId = this.$store.state.route.query.id || 239;
      self.loadWorks();
      return;
    }
    const fullPath = `${location.origin}${
      location.pathname
    }#/new-music-box-viewer?id=${self.$store.state.route.query.id}`;
    WxShare.prepareShareConfig().then(() => {
      WxShare.prepareShareContent({
        title: "MUSIXISE",
        desc: "我的地盘你就dê听我的",
        // fullPath:location.href.split('#')[0],
        fullPath,
        imgUrl: "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
      });
    });
    // alert(Cookies.get('serviceToken'))
    if (Util.getUrlParam("code") || Cookies.get("serviceToken")) {
      //TODO:ajax call to get info
      Api.getUserInfo(Util.getUrlParam("code"))
        .then(res => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove("serviceToken");
            location.replace(
              // will publish to node project m-musixise, under '/music-box' path
              `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
                fullPath
              )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
            );
          }
          self.userId =
            this.$store.state.route.query.id || res.data.data.userId;
          self.isMe = self.userId == res.data.data.userId;
          self.loadMusixiserById();

          console.log("get user info success", res.data.data);
        })
        .catch(err => {
          Cookies.remove("serviceToken");
          location.replace(
            `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
              fullPath
            )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
          );
        });
    } else {
      //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=${encodeURIComponent(
          fullPath
        )}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
      );
    }
  }
};
</script>
<template>
  <div style="display:flex;">
    <swiper :options="bigCardListOption" ref="bigCardList">
      <swiper-slide v-for="work in musixiserWorksObj.content" :key="work.id">
        <card :workInfo="work" :onPlayWork="playWork"></card>
      </swiper-slide>
    </swiper>
  </div>
</template>
<style lang="scss">
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
</style>

