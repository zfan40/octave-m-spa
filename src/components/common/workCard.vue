

<script>
const status = [];
export default {
  props: {
    // editing: bool. //instead of as state, can be passed in prop, to keep only one current editing card in a work card list
    // onPlayClick: function. //
    // onPauseClick: function. //
    isMine: {
      type: Boolean,
      default: false
    },
    workInfo: { type: Object },
    playingStatus: {
      type: Boolean,
      default: false
    },
    showAuthor: { type: Boolean, default: true },
    maskOn: { type: Boolean, default: false },
    onPlayWork: Function,
    onPurchaseWork: Function,
    onDownloadWork: Function,
    onShareWork: Function,
    onChangeWorkStatus: Function,
    onToggleLike: Function,
    onClickTag: Function,
    onLongPress: {
      type: Function,
      default: function() {
        console.log("longpress");
      }
    },
    onTapMask: Function
  },
  computed: {},
  data() {
    const mock = {
      id: 148,
      title: "castle",
      cover: "",
      content: "default",
      url: "//img.musixise.com/LIjPhuhF_castle.mid",
      favStatus: 0,
      createdDate: "2019-01-10 23:38:18",
      userId: 239,
      collectNum: 0,
      lastModifiedDate: "2019-01-17 11:51:03",
      machineNum: 19,
      fileHash: "f0af50f723c10857ad5348fe52ee8f1c",
      userVO: {
        id: 108,
        username: "wechat_oazyg56Zj4X6HViD9h0jB2BTOHJQ",
        realname: "花子文",
        tel: "",
        email: "wechat_oazyg56Zj4X6HViD9h0jB2BTOHJQ@musixise.com",
        birth: "2000-01-01",
        gender: "",
        smallAvatar:
          "//thirdwx.qlogo.cn/mmopen/vi_32/Q3auHgzwzM5OUNntatJGnibRkygaFhMZickUgUMDulSibFI0yQhNqYSZFYqK6BtdDItuC9uDALXwibxcvlibBvR1cknqfYVyf1KND/132",
        largeAvatar:
          "//thirdwx.qlogo.cn/mmopen/vi_32/Q3auHgzwzM5OUNntatJGnibRkygaFhMZickUgUMDulSibFI0yQhNqYSZFYqK6BtdDItuC9uDALXwibxcvlibBvR1cknqfYVyf1KND/132",
        nation: "",
        isMaster: 0,
        brief: null,
        favStatus: 0,
        followNum: 0,
        fansNum: 0,
        songNum: 43,
        userId: 239,
        createdDate: "2019-01-02 12:41:55"
      }
    };
    return {
      info: mock,
      workStatusMap: { 0: "公开", 1: "私密", 2: "删除" }
      // editing: false
    };
  },
  watch: {},
  created() {
    // alert(this.progress)
  },
  mounted() {},
  updated() {},
  methods: {
    // showMask() {
    //   // TODO: should be prop
    //   console.log("aiyo");
    //   this.editing = true;
    // },
    // hideMask() {
    //   // can be in state data
    //   this.editing = false;
    // }
    gotoWork(id) {
      this.$router.push({
        path: "/new-music-box-viewer",
        query: {
          id
        }
      });
    },
    gotoMusixiser(id) {
      this.$router.push({
        path: "/musixiser",
        query: {
          id
        }
      });
    }
  }
};
</script>

<template>
  <div class="work-container" v-longpress="onLongPress">
    <transition name="fade">
      <div v-show="maskOn" class="mask" @touchstart.self="onTapMask">
        <div
          :class="['circle-btn',workInfo.machineNum>18?'gray':'pink']"
          @touchstart="onPurchaseWork"
        >购买</div>
        <!-- <div class="circle-btn purple" @click="onShareWork">分享</div> -->
        <div :class="['circle-btn','purple']" @touchstart="onDownloadWork">下载</div>
        <div
          v-if="isMine"
          class="circle-btn blue"
          @click="onChangeWorkStatus(workInfo,workInfo.status==0?1:0)"
        >{{workInfo.status==0?workStatusMap[1]:workStatusMap[0]}}</div>
        <div v-if="isMine" class="circle-btn gray" @touchstart="onChangeWorkStatus(workInfo,2)">删除</div>
      </div>
    </transition>
    <img
      v-if="workInfo.machineNum<=18"
      class="mb-tag"
      src="../../assets/mb-tag.svg"
      @click="onClickTag"
    >
    <div class="preview-bg" @click="onPlayWork">
      <img v-if="workInfo.cover.indexOf('//')>=0" class="cover" :src="workInfo.cover" alt>
      <div v-if="workInfo.cover.indexOf('//')<0" class="dark-mask"></div>
      <img class="playBtn" v-if="!playingStatus" src="../../assets/viewer/trans-play.png" alt>
      <img class="playBtn" v-if="playingStatus" src="../../assets/stop.svg" alt>
    </div>
    <div class="detail">
      <p class="title" @click="gotoWork(workInfo.id)">{{workInfo.title}}</p>
      <div class="user" @click="gotoMusixiser(workInfo.userId)">
        <img class="avatar" :src="workInfo.userVO.smallAvatar" alt>
        <p class="song-title">{{workInfo.userVO.realname}}</p>
      </div>
      <div class="detail-other">
        <div>{{workInfo.lastModifiedDate|getDateDiff}}更新</div>
        <div class="likes" @click="onToggleLike(workInfo)">
          <img v-if="!workInfo.favStatus" src="../../assets/heartstroke.svg" alt>
          <img v-if="workInfo.favStatus" src="../../assets/heartfill.svg" alt>
          {{workInfo.collectNum}}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../_common/style/_functions.scss";
@import "../../_common/style/_variables.scss";
@import "../../_common/style/_mixins.scss";
@import "../../_common/style/_reboot.scss";
.work-container {
  display: inline-block;
  position: relative;
  width: getRem(342);
  height: getRem(372);
  margin-bottom: getRem(16);
  padding: getRem(16);
  background-color: $dark-gray;
  // margin-right: getRem(16);
  .mask {
    z-index: 2;
    top: 0;
    left: 0;
    position: absolute;
    background-color: $img-mask;
    width: 100%;
    height: 100%;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    .circle-btn {
      border-radius: getRem(38);
      width: getRem(76);
      height: getRem(76);
      margin: getRem(24);
      font-size: getRem(20);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .statusProcess {
      width: getRem(204);
      height: getRem(28);
    }
    .statusText {
      font-size: 14px;
      color: white;
    }
  }
  .preview-bg {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: getRem(208);
    margin-bottom: getRem(16);
    background: #262729;
    .playBtn {
      position: relative;
      width: getRem(30);
      height: getRem(42);
    }
    .playBtn:after {
      content: "";
      position: absolute;
      top: -10px;
      bottom: -10px;
      left: -10px;
      right: -10px;
    }
    .dark-mask {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: getRem(40) getRem(40) 0 0;
      overflow: hidden;
      background: url("../../assets/notes.svg") center center no-repeat;
      background-size: 1rem;
      opacity: 0.2;
    }
    .cover {
      position: absolute;
      object-fit: cover;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }
  }
  .mb-tag {
    position: absolute;
    width: getRem(70);
    top: 0;
    right: 0;
    z-index: 1;
  }
  .detail {
    position: relative;
    width: 100%;
    background-color: $dark-gray;
    color: $gray-text;
    text-align: left;
    .title {
      font-size: getRem(28);
      line-height: getRem(40);
      color: #8c8c92;
    }
    .user {
      display: flex;
      align-items: center;
      margin-bottom: getRem(14);
      .avatar {
        width: getRem(46);
        height: getRem(46);
        border-radius: getRem(23);
        margin-right: getRem(8);
      }
      .song-title {
        font-size: 12px;
        color: #6d6e75;
      }
    }
    .detail-other {
      display: flex;
      justify-content: space-between;
      // padding: getRem(10) getRem(16);
      font-size: 10px;
      .likes {
        display: flex;
        align-items: center;
        img {
          width: getRem(26);
          height: getRem(22);
          margin-right: getRem(8);
        }
      }
    }
  }
}
.pink {
  background-color: $pink;
}
.blue {
  background-color: $blue;
}
.purple {
  background-color: $purple;
}
.gray {
  background-color: $gray;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
