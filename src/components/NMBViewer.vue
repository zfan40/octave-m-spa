<script>
// window.Tone = require('tone')
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import * as Magic from "../_common/js/magic";
import { mbMixin } from "../_common/js/mixin.js";
import CountButton from "./common/countButton";
import * as WxShare from "../_common/js/wx_share";
const MARQUEE_SPEED = 40;
// const musicPart;

export default {
  mixins: [mbMixin],
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
      handAppear: false,
      composeAppear: false,
      playing: false,
      userId: 0,
      favStatus: false,
      newWorkTitle: "",
      newMessage: "",
      newCover: "",
      finalNewWorkTitle: "",
      finalNewMessage: "",
      marqueeStyle: ""
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
      console.log("hehe", this.$store.state);
      const { id } = this.$store.state.route.query;
      if (id) {
        // 从id取作品
        console.log("mmm", id);
        this.$store.dispatch("FETCH_MBOX", { id }).then(() => {
          console.log("workPart", this.project);
          console.log("work info", this.projectInfo);
          if (this.userId === this.projectInfo.userId) {
            this.workUpdateAppear = true;
          }
          this.favStatus = this.projectInfo.favStatus;
          this.newWorkTitle =
            this.projectInfo.title === "尚未起名" ? "" : this.projectInfo.title;
          this.newMessage = this.projectInfo.content;
          this.newCover = this.projectInfo.cover;
          // alert('load complete');
          // this.togglePlay();
          document.title = this.projectInfo.title;
          const fullPath = `${location.origin}${
            location.pathname
          }#/new-music-box-viewer?id=${this.$store.state.route.query.id}`;
          WxShare.prepareShareConfig().then(() => {
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
      this.handAppear = false;
      this.playing
        ? this.$ga.event("Song", "stop_20s", `${this.projectInfo.id}`)
        : this.$ga.event("Song", "play_20s", `${this.projectInfo.id}`);
      Magic.preview(this.project, !this.playing);
      this.playing = !this.playing;
    },
    toggleFav() {
      if (!this.favStatus)
        this.$ga.event("Song", "fav", `${this.projectInfo.id}`);
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
          this.$loading.close();
          // console.log("url:", imgUrl);
          this.newCover = imgUrl;
        },
        () => {
          this.$loading.close();
          this.$toast("上传失败");
          // alert("mayemeigan");
        },
        () => {
          this.$loading("正在上传图片");
        }
      );
    },
    updateWork() {
      if (!this.newWorkTitle) {
        this.$toast("作品名称不能为空");
        return;
      }
      if (this.newWorkTitle.length > 30) {
        this.$toast("作品名称过长");
        return;
      }
      if (this.newMessage && this.newMessage.length > 30) {
        this.$toast("作品留言过长");
        return;
      }
      Api.updateWork({
        id: this.$store.state.route.query.id,
        title: this.newWorkTitle,
        cover: this.newCover,
        content: this.newMessage
      })
        .then(
          () => {
            this.$toast("作品更新成功");
            this.workUpdateAppear = false;
            this.finalNewWorkTitle = this.newWorkTitle;
            this.finalNewMessage = this.newMessage;
            this.$nextTick(function() {
              // update message section
              this.marqueeStyle = "";
              if (
                this.$refs.insider &&
                this.$refs.outsider &&
                this.$refs.insider.offsetWidth > this.$refs.outsider.offsetWidth
              ) {
                var t = this.$refs.insider.offsetWidth / MARQUEE_SPEED + "s;";
                this.marqueeStyle +=
                  "-webkit-animation:marquee linear infinite;-o-animation:marquee linear infinite;animation:  marquee linear infinite;-webkit-animation-duration:" +
                  t +
                  "-o-animation-duration:" +
                  t +
                  "animation-duration:" +
                  t +
                  ";";
              } else {
                this.marqueeStyle += "";
              }
            });
            document.title = this.finalNewWorkTitle;
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
          },
          () => {
            this.$toast("作品更新失败");
          }
        )
        .catch(() => {
          this.$toast("作品更新失败");
        });
    },
    redirectToAccount() {
      window.location.href =
        "https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=Mzg4NjAzODEyMw==&scene=126&bizpsid=0&sharer_username=gh_b74c934625cb&subscene=0&clicktime=1557398370#wechat_redirect";
    },
    redirectToMaker() {
      this.composeAppear = true;
      this.$ga.event("Work", "create", "fromSharePage");
    },
    toKeyMaker() {
      this.$ga.event("Work", "create", "byKeyboard");
      this.$router.push({
        path: "/new-music-box-maker"
      });
    },
    toSeqMaker() {
      this.$ga.event("Work", "create", "bySeq");
      this.$router.push({
        path: "/new-music-box-roll"
      });
    },
    guideShare() {
      this.$ga.event("MyWork", "DetailShare");
      this.$toast("作品取名后，点击右上角分享哦～");
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
    editWork() {
      this.$ga.event("MyWork", "DetailEdit");
      this.workUpdateAppear = true;
    },
    positionWindow() {
      window.scroll(0, 0);
    },
    purchaseItem() {
      this.$ga.event("MakeMB", "tap", `${this.projectInfo.id}`);
      this.$toast("该功能近期开放,敬请期待~");
      return;
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
    }
  },
  beforeRouteLeave(to, from, next) {
    Magic.clearTone();
    next();
  },
  created() {
    // check cookie to get serviceToken first
    // if stoken not exist, go auth
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
    // WxShare.prepareShareConfig().then(() => {
    //   WxShare.prepareShareContent({
    //     title: "哎八音",
    //     desc: "分享一个八音盒",
    //     // fullPath:location.href.split('#')[0],
    //     fullPath,
    //     imgUrl: "http://img.musixise.com/Ocrg2srw_icon33@2x.png"
    //   });
    // });
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
          if (self.uesrId == self.projectInfo.userId) {
            self.$ga.event("MyWork", "DetailCheck");
          }
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
      this.$nextTick(function() {
        // DOM updated
        this.marqueeStyle = "";
        if (
          this.$refs.insider &&
          this.$refs.outsider &&
          this.$refs.insider.offsetWidth > this.$refs.outsider.offsetWidth
        ) {
          var t = this.$refs.insider.offsetWidth / MARQUEE_SPEED + "s;";
          this.marqueeStyle +=
            "-webkit-animation:marquee linear infinite;-o-animation:marquee linear infinite;animation:  marquee linear infinite;-webkit-animation-duration:" +
            t +
            "-o-animation-duration:" +
            t +
            "animation-duration:" +
            t +
            ";";
        } else {
          this.marqueeStyle += "";
        }
      });
    }, 4500);
    setTimeout(() => {
      this.controlPanalAppear = true;
      this.handAppear = true;
    }, 5500);
    // setTimeout(()=>{this.playing = true},6000)
  },
  updated() {}
};
</script>

<template>
  <div :class="['container', loading?'loading':'']">
    <div id="broadcast" @click="redirectToAccount">
      <p>
        母亲节活动进行中! 创作作品收藏数前三名可免费赢得该曲定制八音盒，
        <a
          href="https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=Mzg4NjAzODEyMw==&scene=126&bizpsid=0&sharer_username=gh_b74c934625cb&subscene=0&clicktime=1557398370#wechat_redirect"
        >更多信息</a>请关注公众号「哎八音」
      </p>
    </div>
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
    <img id="hand" v-if="handAppear" src="../assets/anotherhand.svg">
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
            <img :src="projectInfo.userVO&&projectInfo.userVO.smallAvatar" alt>
          </span>
          <span>{{projectInfo.userVO&&projectInfo.userVO.realname}}</span>
        </div>
        <div ref="outsider" class="work-body-desc">
          <!-- <div
            style="position: absolute;right: -2rem;width: 6rem;background: linear-gradient(45deg, rgba(225,236,237, 0), rgba(225,236,237,60));height: 100%;z-index: 2;"
          ></div>-->
          <p ref="insider" :style="marqueeStyle">{{finalNewMessage||projectInfo.content}}</p>
        </div>
        <div v-if="userId === projectInfo.userId" id="edit-work" @click="editWork"></div>
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
          style="top:.05rem;"
          :initCount="projectInfo.collectNum?projectInfo.collectNum:0"
          :initActive="projectInfo.favStatus?true:false"
          iconImg
          :onClickCall="toggleFav"
        />
        <div class="download-info">
          <div class="likes" @click="downloadWork(projectInfo)">
            <img v-if="!projectInfo.wavAccess" src="../assets/download1.svg" alt>
            <img v-if="projectInfo.wavAccess" src="../assets/download2.svg" alt>
            <!-- <p>.wav</p> -->
          </div>
        </div>
        <div class="button_group">
          <button v-if="userId !== projectInfo.userId" @click="redirectToMaker">我来试试</button>
          <button v-if="userId === projectInfo.userId" @click="guideShare">分享</button>
          <button :class="[projectInfo.machineNum>18?'':'']" @click="purchaseItem">制成礼物</button>
        </div>
        <!-- <div
          :class="['purchaseBtn',projectInfo.machineNum>18?'disabled':'']"
          @click="purchaseItem"
        >购买</div>
        <div class="makeBtn" @click="redirectToMaker">编曲</div>-->
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
              <input v-model="newWorkTitle" @blur="positionWindow" type="text" placeholder="曲名">
            </div>
          </div>
          <div class="splitter"></div>
          <div class="dialog-sector">
            <div class="title">留言</div>
            <div class="input">
              <input
                v-model="newMessage"
                @blur="positionWindow"
                type="text"
                placeholder="参加活动请以「#母亲节」开头"
              >
            </div>
          </div>
          <div class="splitter"></div>
        </div>
        <div class="confirm-btn" @click="updateWork">保存</div>
      </div>
    </transition>
    <transition name="fade">
      <div id="compose-mask" v-show="composeAppear" @click.self="composeAppear=false">
        <div id="compose-pick-container">
          <p>编曲模式</p>
          <div class="main">
            <img src="../assets/keystyle.png" @click="toKeyMaker">
            <img src="../assets/seqstyle.png" @click="toSeqMaker">
          </div>
        </div>
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
