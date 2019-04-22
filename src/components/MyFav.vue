<script>
// window.Tone = require('tone')
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
import { mbMixin } from "../_common/js/mixin.js";
import workCard from "./common/workCard";
import tagDialog from "./common/tagDialog";
import * as WxShare from "../_common/js/wx_share";
import infiniteScroll from "vue-infinite-scroll";

let musicPart = undefined;

export default {
  mixins: [mbMixin],
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
    favWorksObj() {
      return this.$store.state.favWorksObj;
    },
    operatingWorkId() {
      return this.$store.state.operatingWorkId;
    },
    playingWorkId() {
      return this.$store.state.playingWorkId;
    }
  },
  methods: {
    loadMusixiserById() {
      console.log("my id: ", this.userId);
      const id = this.userId; // this.userId手传参id或当前用户id
      this.$store
        .dispatch("FETCH_MUSIXISER", {
          id
        })
        .then(() => {
          const fullPath = `${location.origin}${location.pathname}#/my-fav?id=${
            this.userId
          }`;
          document.title = `${this.$store.state.musixiserInfo.realname}的收藏`;
          WxShare.prepareShareConfig().then(() => {
            WxShare.prepareShareContent({
              title: `${this.$store.state.musixiserInfo.realname}的收藏`,
              desc: "口味不太一样哦～",
              // fullPath:location.href.split('#')[0],
              fullPath,
              imgUrl:
                `http:${this.$store.state.musixiserInfo.smallAvatar}` ||
                "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
            });
          });
        });
      this.busy = false;
      // this.$store.dispatch('FETCH_WORKS_FROM_MUSIXISER', {
      //   id,
      //   page:1
      // })
    },
    loadMore() {
      //will call automatically when enter!
      const id = this.userId;
      // alert(id)
      this.busy = true;
      console.log("1111111", this.favWorksObj.current);
      this.$store
        .dispatch("FETCH_FAV_WORKS", {
          id,
          page: this.favWorksObj.current ? this.favWorksObj.current + 1 : 1
        })
        .then(() => {
          console.log("2222222", this.favWorksObj);
          if (+this.favWorksObj.content.length < +this.favWorksObj.total) {
            this.busy = false;
          }
        });
    },

    operateWork(work) {
      console.log("operate in");
      this.$store.commit("OPERATE_WORK", { work });
    },
    cancelOperate() {
      this.$store.commit("OPERATE_WORK", { work: { id: -1 } });
    },

    shareWork() {
      console.log("share in");
    },
    changeWorkStatus(work, status) {
      Api.updateWork({
        id: work.id,
        status: status
      }).then(() => {
        this.$toast(`已将作品${workStatusMap[status]}`);
        this.cancelOperate();
        this.$store.commit("LOCAL_UPDATE_LIST", {
          type: "favWorksObj",
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
      type: "favWorksObj"
    });
    next();
  },
  created() {
    //check cookie to get serviceToken first
    // if stoken not exist, go auth
    const self = this;
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + "px";
    document.title = "收藏集";
    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) {
      this.userId = this.$store.state.route.query.id || 239;
      self.loadMusixiserById();
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
        v-for="item in favWorksObj.content"
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
        :onToggleLike="()=>toggleLike(item,'favWorksObj')"
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
  top: 0;
  left: 0;
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
  -webkit-overflow-scrolling: touch;
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
