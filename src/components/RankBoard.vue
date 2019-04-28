<script>
// window.Tone = require('tone')
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
import workCard from "./common/workFlatCard";
import { mbMixin } from "../_common/js/mixin.js";
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
      tagAppear: false,
      playerGold: {},
      playerSilver: {},
      playerBronze: {}
    };
  },
  computed: {
    musixiserInfo() {
      return this.$store.state.musixiserInfo;
    },
    boardWorksObj() {
      const a = this.$store.state.boardWorksObj;
      this.playerGold =
        a.content[0] && a.content[0].userVO
          ? a.content[0].userVO
          : {
              smallAvatar:
                "//pic.xiami.net/images/default/xiami_7/avatar_new.png@!c-100-100",
              realname: "虚位以待"
            };
      this.playerSilver =
        a.content[1] && a.content[1].userVO
          ? a.content[1].userVO
          : {
              smallAvatar:
                "//pic.xiami.net/images/default/xiami_7/avatar_new.png@!c-100-100",
              realname: "虚位以待"
            };
      this.playerBronze =
        a.content[2] && a.content[2].userVO
          ? a.content[2].userVO
          : {
              smallAvatar:
                "//pic.xiami.net/images/default/xiami_7/avatar_new.png@!c-100-100",
              realname: "虚位以待"
            };
      return a;
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
      //will call automatically when enter!
      const id = this.userId;
      // alert(id)
      this.busy = true;
      console.log("1111111", this.boardWorksObj.current);
      this.$loading("加载排行中");
      this.$store
        .dispatch("FETCH_BOARD_WORKS", {
          page: 1,
          size: 30,
          category: 1,
          orderStrategy: 2
        })
        .then(() => {
          this.$loading.close();
          console.log("2222222", this.boardWorksObj);
          if (+this.boardWorksObj.content.length < +this.boardWorksObj.total) {
            this.busy = false;
          }
        })
        .catch(() => {
          this.$loading.close();
          this.$toast("加载失败,请稍后再试");
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
      this.loadMore();
      return;
    }
    const fullPath = `${location.origin}${location.pathname}#/rank-board`;
    WxShare.prepareShareConfig().then(() => {
      WxShare.prepareShareContent({
        title: "哎八音母亲节排行榜",
        desc: "免费赠送定制音乐彩色八音盒哦～",
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
          self.userId = res.data.data.userId;
          // self.isMe = self.userId == res.data.data.userId;
          // self.loadMusixiserById();
          this.busy = false;
          this.loadMore();

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
      style="position:fixed;left:0;top:0;width:100%;height:100%;background: linear-gradient(125deg, #464c8b, #39375e);"
    ></div>
    <div
      style="position:absolute; left:-1rem; top: -2.5rem;width:7rem;height:7rem;border-radius:3.5rem;background:linear-gradient(125deg, #7995EE, rgba(69,100,215,0));"
    ></div>
    <div
      style="position:absolute; right:-.4rem; top: 4.5rem;width:4rem;height:4rem;border-radius:2rem;background:linear-gradient(-45deg, #7996EE, rgba(69,100,215,.7));"
    ></div>
    <div id="winner-sector">
      <div class="winner-avatar" id="gold">
        <img
          class="avatar"
          :src="playerGold.smallAvatar"
          @error="
            playerGold.smallAvatar =
              '//pic.xiami.net/images/default/xiami_7/avatar_new.png@!c-100-100'
          "
          alt
        >
        <p class="name">{{ playerGold.realname }}</p>
        <img class="crown" src="../assets/crowngold.png" alt>
      </div>
      <div class="winner-avatar" id="silver">
        <img
          class="avatar"
          :src="playerSilver.smallAvatar"
          @error="
            playerSilver.smallAvatar =
              '//pic.xiami.net/images/default/xiami_7/avatar_new.png@!c-100-100'
          "
          alt
        >
        <p class="name">{{ playerSilver.realname }}</p>
        <img class="crown" src="../assets/crownsilver.png" alt>
      </div>
      <div class="winner-avatar" id="bronze">
        <img
          class="avatar"
          :src="playerBronze.smallAvatar"
          @error="
            playerBronze.smallAvatar =
              '//pic.xiami.net/images/default/xiami_7/avatar_new.png@!c-100-100'
          "
          alt
        >
        <p class="name">{{ playerBronze.realname }}</p>
        <img class="crown" src="../assets/crownbronze.png" alt>
      </div>
    </div>
    <p id="specs">
      母亲节活动说明：
      <br>在5月14日14:00前，获赞排名前三的符合制作标准的八音盒，即可获赠对应乐曲的定制音乐盒，快来参加吧
    </p>
    <div class="worklist">
      <work-card
        v-for="(item, index) in boardWorksObj.content"
        :workInfo="item"
        :key="item.id"
        :rank="index + 1"
        :playingStatus="item.id == playingWorkId"
        :maskOn="item.id == operatingWorkId"
        :onPlayWork="() => playWork(item)"
        :onDownloadWork="() => downloadWork(item)"
        :onToggleLike="() => toggleLike(item, 'boardWorksObj')"
      />
    </div>
    <!-- <div class="emptysection" v-show="!loading && musixiserWorksObj.content.length==0">
      <div>
        <p class="emptytitle">暂无作品</p>
        <img src="../assets/oops.png" style="width:6rem;" alt>
      </div>
    </div>-->
    <tag-dialog
      :appear="tagAppear"
      :handleClose="
        () => {
          tagAppear = false;
        }
      "
    />
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
  background: linear-gradient(125deg, #464c8b, #39375e);
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
  #winner-sector {
    position: relative;
    z-index: 2;
    margin: 0 auto;
    padding-top: getRem(96);
    color: white;
    width: getRem(452);
    height: getRem(192+96);
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    .winner-avatar {
      position: relative;
    }
    .name {
      font-size: getRem(26);
      color: #d0d1d3;
      width: 2rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .avatar {
      margin: 0 auto;
      display: block;
    }
    .crown {
      position: absolute;

      left: 50%;
      -webkit-transform: translateX(-50%);
      transform: translateX(-50%);
    }
    #gold {
      order: 2;
      .crown {
        width: getRem(44);
        height: getRem(44);
        top: -0.4rem;
      }
      .avatar {
        position: relative;
        width: getRem(122);
        height: getRem(122);
        border-radius: getRem(61);
        margin-bottom: getRem(10);
      }
    }
    #silver {
      margin-top: getRem(20);
      order: 1;
      .crown {
        width: getRem(36);
        height: getRem(36);
        top: -0.3rem;
      }
      .avatar {
        width: getRem(100);
        height: getRem(100);
        border-radius: getRem(50);
        margin-bottom: getRem(20);
      }
    }
    #bronze {
      margin-top: getRem(30);
      order: 3;
      .crown {
        width: getRem(26);
        height: getRem(26);
        top: -0.2rem;
      }
      .avatar {
        width: getRem(74);
        height: getRem(74);
        border-radius: getRem(37);
        margin-bottom: getRem(30);
      }
    }
  }
  #specs {
    position: relative;
    opacity: 0.8;
    color: white;
    font-size: getRem(20);
    padding: getRem(32);
    text-align: left;
  }
}
.worklist {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-content: flex-start;
  flex-wrap: wrap;
  padding: getRem(32);
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
