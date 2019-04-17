<script>
// window.Tone = require('tone')
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
import workCard from "./common/workCard";
import tagDialog from "./common/tagDialog";
import * as WxShare from "../_common/js/wx_share";
import infiniteScroll from "vue-infinite-scroll";

let musicPart = undefined;

export default {
  directives: {
    infiniteScroll
  },
  components: {
    workCard,
    tagDialog
  },
  data() {
    return {
      // playing: false,
      loading: true,
      playing: false,
      userId: 0,
      isMe: false,
      favStatus: false,
      newWorkTitle: "",
      finalNewWorkTitle: "",
      busy: true,
      tagAppear: false
    };
  },
  computed: {
    musixiserInfo() {
      return this.$store.state.musixiserInfo;
    },
    boardWorksObj() {
      return this.$store.state.boardWorksObj;
    },
    operatingWorkId() {
      return this.$store.state.operatingWorkId;
    },
    playingWorkId() {
      return this.$store.state.playingWorkId;
    }
  },
  methods: {
    // loadMusixiserById() {
    //   console.log("my id: ", this.userId);
    //   const id = this.userId; // this.userId手传参id或当前用户id
    //   this.$store
    //     .dispatch("FETCH_MUSIXISER", {
    //       id
    //     })
    //     .then(() => {
    //       const fullPath = `${location.origin}${location.pathname}#/my-fav?id=${
    //         this.userId
    //       }`;
    //       document.title = `${this.$store.state.musixiserInfo.realname}的收藏`;
    //       WxShare.prepareShareConfig().then(() => {
    //         WxShare.prepareShareContent({
    //           title: `${this.$store.state.musixiserInfo.realname}的收藏`,
    //           desc: "口味不太一样哦～",
    //           // fullPath:location.href.split('#')[0],
    //           fullPath,
    //           imgUrl:
    //             `http:${this.$store.state.musixiserInfo.smallAvatar}` ||
    //             "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
    //         });
    //       });
    //     });
    //   this.busy = false;
    //   // this.$store.dispatch('FETCH_WORKS_FROM_MUSIXISER', {
    //   //   id,
    //   //   page:1
    //   // })
    // },
    loadMore() {
      alert("jb");
      //will call automatically when enter!
      const id = this.userId;
      // alert(id)
      this.busy = true;
      console.log("1111111", this.boardWorksObj.current);
      this.$store
        .dispatch("FETCH_BOARD_WORKS", {
          page: this.boardWorksObj.current ? this.boardWorksObj.current + 1 : 1,
          size: 10,
          category: 1,
          orderCategory: 2
        })
        .then(() => {
          console.log("2222222", this.boardWorksObj);
          if (+this.boardWorksObj.content.length < +this.boardWorksObj.total) {
            this.busy = false;
          }
        });
    },
    playWork(work) {
      console.log("work going to play: ", work);
      if (work.id != this.playingWorkId) {
        this.$ga.event({
          eventCategory: "Song",
          eventAction: "play_20s",
          eventLabel: work.id,
          eventValue: ""
        });
        this.playing = true;
        Magic.previewMidi(work.url, this.playing);
        this.$store.commit("PLAY_WORK", { work });
      } else {
        //操作的同一个
        if (this.playing) {
          //正播着这个呢
          this.$ga.event({
            eventCategory: "Song",
            eventAction: "stop_20s",
            eventLabel: work.id,
            eventValue: ""
          });
          this.playing = false;
          Magic.previewMidi(work.url, this.playing);
          this.$store.commit("PLAY_WORK", { work: { id: -1 } });
        } else {
          //这个已经被停了
          this.$ga.event({
            eventCategory: "Song",
            eventAction: "play_20s",
            eventLabel: work.id,
            eventValue: ""
          });
          this.playing = true;
          Magic.previewMidi(work.url, 1);
          this.$store.commit("PLAY_WORK", { work });
        }
      }
    },
    operateWork(work) {
      console.log("operate in");
      this.$store.commit("OPERATE_WORK", { work });
    },
    cancelOperate() {
      this.$store.commit("OPERATE_WORK", { work: { id: -1 } });
    },
    downloadWork(work) {
      this.$ga.event({
        eventCategory: "Download",
        eventAction: "tap",
        eventLabel: work.id,
        eventValue: ""
      });
      this.$loading("下载中...");
      Magic.bounceAsWavBlob(work.url)
        .then(blob => {
          return Api.downloadAsWav(blob);
        })
        .then(url => {
          // this.$toast(`url is ${url}`);
          this.$ga.event({
            eventCategory: "Download",
            eventAction: "success",
            eventLabel: work.id,
            eventValue: ""
          });
          this.$loading.close();
          location.href = url;
        })
        .catch(() => {
          this.$loading.close();
          this.$toast("下载失败请稍后再试");
        });
    },
    purchaseWork(work) {
      this.$ga.event({
        eventCategory: "MakeMB",
        eventAction: "tap",
        eventLabel: work.id,
        eventValue: ""
      });
      if (work.machineNum > 18) {
        this.$toast("该作品目前无法制作");
        return;
      }
      console.log("purchase in");
      this.$store.commit("SAVE_ORDER_INFO", { work }); // store current workId
      this.$router.push({
        path: "/product-list",
        query: {
          // id
        }
      });
    },
    shareWork() {
      console.log("share in");
    },
    toggleLike(work) {
      // console.log('current work info',work.favStatus)
      if (!work.status)
        this.$ga.event({
          eventCategory: "Song",
          eventAction: "fav",
          eventLabel: work.id,
          eventValue: ""
        });
      Api.toggleFavSong({
        workId: work.id,
        status: +!work.favStatus
      }).then(() => {
        this.$store.commit("LOCAL_UPDATE_LIST_FAV", {
          type: "boardWorksObj",
          item: {
            id: work.id,
            favStatus: +!work.favStatus
          }
        });
      });
    },
    changeWorkStatus(work, status) {
      Api.updateWork({
        id: work.id,
        status: status
      }).then(() => {
        this.$toast(`已将作品${workStatusMap[status]}`);
        this.cancelOperate();
        this.$store.commit("LOCAL_UPDATE_LIST", {
          type: "boardWorksObj",
          item: {
            id: work.id,
            status
          }
        });
      });
    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone();
    this.$store.commit("RESET_WORK_LIST", {
      type: "boardWorksObj"
    });
    next();
  },
  created() {
    //check cookie to get serviceToken first
    // if stoken not exist, go auth

    const self = this;
    this.busy = false;
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + "px";
    document.title = "排行榜";
    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) {
      // this.userId = this.$store.state.route.query.id || 239;
      return;
    }
    const fullPath = `${location.origin}${location.pathname}#/my-fav?id=${
      self.$store.state.route.query.id
    }`;
    // WxShare.prepareShareConfig().then(() => {
    //   WxShare.prepareShareContent({
    //     title: "MUSIXISE",
    //     desc: "我的地盘你就dê听我的",
    //     // fullPath:location.href.split('#')[0],
    //     fullPath,
    //     imgUrl: "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
    //   });
    // });
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
          self.userId = res.data.data.userId;
          // self.isMe = self.userId == res.data.data.userId;
          // self.loadMusixiserById();
          this.busy = false;

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
  },
  mounted() {
    // this.startRecord();
    setTimeout(() => {
      this.loading = false;
    }, 2000);
    // setTimeout(()=>{this.playing = true},6000)
  },
  updated() {}
};
</script>

<template>
  <div class="container">
    <!-- <div class="">
    {{musixiserInfo.realname}}
    </div>-->
    <div
      v-infinite-scroll="loadMore"
      infinite-scroll-disabled="busy"
      infinite-scroll-distance="10"
      class="worklist"
    >
      <work-card
        v-for="item in boardWorksObj.content"
        :workInfo="item"
        :key="item.id"
        :playingStatus="item.id==playingWorkId"
        :maskOn="item.id==operatingWorkId"
        :onLongPress="()=>operateWork(item)"
        :onPlayWork="()=>playWork(item)"
        :onDownloadWork="()=>downloadWork(item)"
        :onPurchaseWork="()=>purchaseWork(item)"
        :onClickTag="()=>{tagAppear=true}"
        :onShareWork="shareWork"
        :onChangeWorkStatus="changeWorkStatus"
        :onTapMask="cancelOperate"
        :onToggleLike="toggleLike"
      />
    </div>
    <!-- <div class="emptysection" v-show="!loading && musixiserWorksObj.content.length==0">
      <div>
        <p class="emptytitle">暂无作品</p>
        <img src="../assets/oops.png" style="width:6rem;" alt>
      </div>
    </div>-->
    <tag-dialog :appear="tagAppear" :handleClose="()=>{tagAppear=false}"/>
  </div>
</template>
<style lang="scss" scoped>
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";

.container {
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: #404249;
}
.worklist {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-content: flex-start;
  flex-wrap: wrap;
  padding: getRem(20);
  background-color: #404249;
  overflow: scroll;
}
.hairline {
  height: 1px;
  background: #979797;
  transform: scaleY(0.5);
}
.work {
  position: relative;
  display: flex;
  height: getRem(174);
  margin-bottom: getRem(30);
  .cover {
    position: relative;
    width: getRem(174);
    height: getRem(174);
    margin-top: getRem(18);
  }
  .detail {
    flex: 1;
    padding-left: getRem(30);
    .line {
      display: flex;
      justify-content: space-between;
    }
    .line1 {
      padding-top: getRem(40);
      padding-bottom: getRem(60);
      line-height: getRem(30);
    }
    .line2 {
      padding-bottom: getRem(30);
      line-height: getRem(30);
    }
    .title {
      font-size: getRem(28);
      color: #8c8c92;
    }
    .date {
      font-size: getRem(20);
      color: #6d6e75;
    }
    .creator {
      font-size: getRem(24);
      color: #6d6e75;
    }
    .likes {
      font-size: getRem(20);
      color: rgba(255, 255, 255, 0.3);
    }
  }
}
.emptysection {
  position: relative;
  height: 100%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  .emptytitle {
    font-size: 1.4rem;
    font-weight: 200;
  }
}
</style>
