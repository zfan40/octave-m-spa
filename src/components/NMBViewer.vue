<script>
// window.Tone = require('tone')
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
import CountButton from "./common/countButton";
import * as WxShare from "../_common/js/wx_share";

// const musicPart;

export default {
  components: {
    CountButton
  },
  data() {
    return {
      // playing: false,
      loading: true,
      workIntroAppear: false,
      controlPanalAppear: false,
      workUpdateAppear: false,
      playing: false,
      userId: 0,
      favStatus: false,
      newWorkTitle: "",
      newMessage: "",
      newCover: "",
      finalNewWorkTitle: ""
    };
  },
  computed: {
    project() {
      return this.$store.state.recordProject;
    },
    projectInfo() {
      return this.$store.state.recordProjectInfo;
    }
  },
  methods: {
    load() {},
    loadMusicById() {
      // alert(2);
      console.log("hehe", this.$store.state);
      const { id } = this.$store.state.route.query;
      if (id) {
        // 从id取作品
        console.log("mmm", id);
        this.$store.dispatch("FETCH_MBOX", { id }).then(() => {
          console.log("workPart", this.project);
          console.log("work info", this.projectInfo);
          this.favStatus = this.projectInfo.favStatus;
          this.newWorkTitle = this.projectInfo.title;
          this.newMessage = this.projectInfo.content;
          this.newCover = this.projectInfo.cover;
          // alert('load complete');
          // this.togglePlay();
          const fullPath = `${location.origin}${
            location.pathname
          }#/new-music-box-viewer?id=${this.$store.state.route.query.id}`;
          WxShare.prepareShareContent({
            title: `${this.projectInfo.userVO.realname}做了个八音盒-${
              this.projectInfo.title
            }`,
            desc: "一般人儿我不告诉TA",
            // fullPath:location.href.split('#')[0],
            fullPath,
            imgUrl:
              this.projectInfo.cover ||
              "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
          });
        });
      } else {
        // 不会出现这个情况
        // this.$store.dispatch("FETCH_MBOX", { id: 50 }).then(() => {
        //   console.log("workPart", this.project);
        //   console.log("work info", this.projectInfo);
        //   this.favStatus = this.projectInfo.favStatus;
        //   // alert('load complete');
        //   // this.togglePlay();
        // });
      }
    },
    togglePlay() {
      // alert('111')
      Magic.preview(this.project, !this.playing);
      this.playing = !this.playing;
    },
    toggleFav() {
      this.favStatus = +!this.favStatus;
      Api.toggleFavSong({
        workId: this.$store.state.route.query.id,
        status: this.favStatus
      })
        .then(() => {})
        .catch(err => {
          // alert(JSON.stringify(err))
        });
    },
    uploadPic() {
      WxShare.selectAndUploadImage(
        imgUrl => {
          console.log("url:", imgUrl);
          this.newCover = imgUrl;
        },
        () => {
          // alert("mayemeigan");
        }
      );
    },
    updateWork() {
      Api.updateWork({
        id: this.$store.state.route.query.id,
        title: this.newWorkTitle,
        cover: this.newCover,
        content: this.newMessage
      });
      this.finalNewWorkTitle = this.newWorkTitle;
      const fullPath = `${location.origin}${
        location.pathname
      }#/new-music-box-viewer?id=${this.$store.state.route.query.id}`;
      WxShare.prepareShareContent({
        title: `${this.projectInfo.userVO.realname}做了个八音盒-${
          this.newWorkTitle
        }`,
        desc: "一般人儿我不告诉TA",
        // fullPath:location.href.split('#')[0],
        fullPath,
        imgUrl:
          this.projectInfo.cover ||
          "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
      });
      setTimeout(() => {
        this.workUpdateAppear = false;
      }, 300);
    },
    redirectToMaker() {
      this.$router.push({
        path: "/new-music-box-maker"
        // query: {
        //   id
        // }
      });
    },
    redirectToMusixiser(id) {
      if (id) {
        this.$router.push({
          path: "/musixiser",
          query: {
            id
          }
        });
      }
    },
    positionWindow() {
      window.scroll(0, 0);
    },
    purchaseItem() {
      if (this.projectInfo.machineNum > 18) {
        this.$toast("该作品目前无法制作");
        return;
      }
      // TODO: router push with workId
      console.log(`you are about to purchase ${this.projectInfo.id}`);
      this.$store.commit("SAVE_ORDER_INFO", {
        work: {
          ...this.projectInfo,
          title: this.newWorkTitle,
          content: this.newMessage
        }
      }); // store current workId

      this.$router.push({
        path: "/product-list",
        query: {
          // id
        }
      });
      // WxShare.newMakeWxOrder(
      //   { pid: 1, wid: this.projectInfo.id, amount: 1 },
      //   () => {
      //     console.log("pay succeed");
      //   },
      //   () => {
      //     console.log("pay fail");
      //   }
      // );
    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone();
    next();
  },
  created() {
    // check cookie to get serviceToken first
    // if stoken not exist, go auth
    // alert(1);
    const self = this;
    const docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = `${window.rem}px`;

    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) {
      self.loadMusicById();
      return;
    }
    const fullPath = `${location.origin}${
      location.pathname
    }#/new-music-box-viewer?id=${self.$store.state.route.query.id}`;
    WxShare.prepareShareConfig().then(() => {
      WxShare.prepareShareContent({
        title: "MUSIXISE",
        desc: "分享一个八音盒",
        // fullPath:location.href.split('#')[0],
        fullPath,
        imgUrl: "https://img.musixise.com/Ocrg2srw_icon33@2x.png"
      });
    });
    // alert(Cookies.get('serviceToken'))
    if (Util.getUrlParam("code") || Cookies.get("serviceToken")) {
      // TODO:ajax call to get info
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
          // alert(`welcome${res.data.data.realname}`)
          // if (!this.project) {
          self.loadMusicById();
          // }

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
      // 又没有微信给的auth code又没有token存在cookie，只得验证
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
    setTimeout(() => {
      this.workIntroAppear = true;
    }, 4500);
    setTimeout(() => {
      this.controlPanalAppear = true;
    }, 5500);
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
      <div id="mb-shiner" :class="[playing?'':'not-playing']"></div>
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
        <div
          class="title"
          @click="userId === projectInfo.userId?workUpdateAppear=true:workUpdateAppear=false"
        >{{finalNewWorkTitle||projectInfo.title}}</div>
        <div class="subtitle">
          <span>by</span>
          <span @click="redirectToMusixiser(projectInfo.userVO.userId)">
            <img :src="projectInfo.userVO.smallAvatar" alt>
          </span>
          <span>{{projectInfo.userVO.realname}}</span>
        </div>
        <div v-if="userId === projectInfo.userId" id="edit-work" @click="workUpdateAppear=true"></div>
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
        </div>-->
        <count-button
          :initCount="projectInfo.collectNum?projectInfo.collectNum:0"
          :initActive="projectInfo.favStatus?true:false"
          iconImg
          :onClickCall="toggleFav"
        />
        <div
          :class="['purchaseBtn',projectInfo.machineNum>18?'disabled':'']"
          @click="purchaseItem"
        >购买</div>
        <div class="makeBtn" @click="redirectToMaker">编曲</div>
      </div>
    </transition>
    <transition name="fade">
      <div id="work-update-mask" v-show="workUpdateAppear" @click.self="workUpdateAppear=false">
        <div class="mb-dialog">
          <div class="dialog-sector">
            <div class="title">配图</div>
            <img
              class="work-cover"
              :src="newCover||'https://cdn.cnbj1.fds.api.mi-img.com/mbox/img/default-s-bg.jpg'"
              @click="uploadPic"
              alt
            >
          </div>
          <div class="splitter"></div>
          <div class="dialog-sector">
            <div class="title">曲名</div>
            <div class="input">
              <input v-model="newWorkTitle" @blur="positionWindow" type="text" placeholder="ss">
            </div>
          </div>
          <div class="splitter"></div>
          <div class="dialog-sector">
            <div class="title">留言</div>
            <div class="input">
              <input v-model="newMessage" @blur="positionWindow" type="text" placeholder="留言">
            </div>
          </div>
          <div class="splitter"></div>
        </div>
        <div class="confirm-btn" @click="updateWork">保存</div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
@import "./NMBViewer.scss";
</style>
