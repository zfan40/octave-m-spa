<script>
import Card from "./common/BigCard";
import { swiper, swiperSlide } from "vue-awesome-swiper";
import * as Magic from "../_common/js/magic";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
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
    squareWorksobj() {
      return this.$store.state.squareWorksobj;
    },
    // operatingWorkId() {
    //   return this.$store.state.operatingWorkId;
    // },
    playingWorkId() {
      return this.$store.state.playingWorkId;
    },
    bigSwiper() {
      return this.$refs.bigCardList.swiper;
    }
  },
  methods: {
    loadMusixiserById() {
      console.log("my id: ", this.userId);
      const id = this.userId; // this.userId手传参id或当前用户id
      this.$store.dispatch("FETCH_MUSIXISER", {
        id
      });
      this.busy = false;
      // this.$store.dispatch('FETCH_WORKS_FROM_MUSIXISER', {
      //   id,
      //   page:1
      // })
    },
    playWork(work) {
      console.log("work going to play: ", work);
      if (work.id != this.playingWorkId) {
        this.playing = true;
        Magic.previewMidi(work.url, this.playing);

        this.$store.commit("PLAY_WORK", { work });
      } else {
        //操作的同一个
        if (this.playing) {
          //正播着这个呢
          this.playing = false;
          Magic.previewMidi(work.url, this.playing);
          this.$store.commit("PLAY_WORK", { work: { id: -1 } });
        } else {
          //这个已经被停了
          this.playing = true;
          Magic.previewMidi(work.url, 1);
          this.$store.commit("PLAY_WORK", { work });
        }
      }
    },
    purchaseWork(work) {
      console.log("purchase in");
      this.$store.commit("SAVE_ORDER_INFO", { work }); // store current workId
      this.$router.push({
        path: "/product-list",
        query: {
          // id
        }
      });
    },
    toggleLike(workInfo) {
      // console.log('current work info',workInfo.favStatus)
      Api.toggleFavSong({
        workId: workInfo.id,
        status: +!workInfo.favStatus
      }).then(() => {
        this.$store.commit("LOCAL_UPDATE_LIST_FAV", {
          type: "squareWorksobj",
          item: {
            id: workInfo.id,
            favStatus: +!workInfo.favStatus
          }
        });
      });
    },
    // initload(){
    //    this.$store.dispatch('FETCH_SQUARE_WORKS', {
    //      FETCH_SQUARE_WORKS
    //    })
    // },
    loadWorks() {
      console.log("my id: ", this.userId);
      const id = this.userId; // this.userId手传参id或当前用户id
      console.log(
        "----------------",
        JSON.stringify(this.$store.state.squareWorksObj),
        this.squareWorksobj
      );
      this.$store
        .dispatch("FETCH_SQUARE_WORKS", {
          id,
          page: this.squareWorksobj.current
            ? this.squareWorksobj.current + 1
            : 1
        })
        .then(() => {
          console.log("2222222", this.squareWorksobj);
          if (
            +this.squareWorksobj.content.length < +this.squareWorksobj.total
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
          self.targetProduct = self.squareWorksobj.content[this.realIndex];
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
  <div style="display:flex;padding-top:2rem;">
    <swiper :options="bigCardListOption" ref="bigCardList">
      <swiper-slide v-for="item in squareWorksobj.content" :key="item.id">
        <card
          :workInfo="item"
          :onPlayWork="()=>playWork(item)"
          :playingStatus="item.id==playingWorkId"
          :onPurchaseWork="()=>purchaseWork(item)"
          :onToggleLike="toggleLike"
        ></card>
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

