

<script>
export default {
  props: {
    // editing: bool. //instead of as state, can be passed in prop, to keep only one current editing card in a work card list
    // onPlayClick: function. //
    // onPauseClick: function. //
    workInfo: { type: Object },
    playingStatus: {
      type: Boolean,
      default: false
    },
    showAuthor: { type: Boolean, default: true },
    maskOn: { type: Boolean, default: false },
    onPlayWork: Function,
    onPurchaseWork: Function,
    onShareWork: Function,
    onHideWork: Function,
    onDeleteWork: Function,
    onToggleLike: Function,
    onDownloadWork: Function,
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
    return {};
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
  <div class="card">
    <div class="preview-bg">
      <img v-if="workInfo.cover.indexOf('//')>=0" class="cover" :src="workInfo.cover" alt>
      <div v-if="workInfo.cover.indexOf('//')<0" class="dark-mask"></div>
      <p class="work-content">{{workInfo.content}}</p>
      <img
        class="playBtn"
        @touchend="onPlayWork"
        v-if="!playingStatus"
        src="../../assets/viewer/trans-play.png"
        alt
      >
      <img
        class="playBtn"
        @touchend="onPlayWork"
        v-if="playingStatus"
        src="../../assets/stop.svg"
        alt
      >
    </div>
    <div class="detail">
      <div class="basic-info">
        <p class="title" @click="gotoWork(workInfo.id)">{{workInfo.title}}</p>
        <div style="display:flex;align-items:center;" @click="gotoMusixiser(workInfo.userId)">
          <img class="avatar" :src="workInfo.userVO.smallAvatar" alt>
          <p class="song-title">{{workInfo.userVO.realname}}</p>
          <p class="update-info">&nbsp;· 更新于{{workInfo.lastModifiedDate|getDateDiff}}</p>
        </div>
      </div>
      <div class="download-info">
        <div class="likes" @click="onDownloadWork(workInfo)">
          <img v-if="!workInfo.wavAccess" src="../../assets/download1.svg" alt>
          <img v-if="workInfo.wavAccess" src="../../assets/download2.svg" alt>
          <p>.wav</p>
        </div>
      </div>
      <div class="like-info">
        <div class="likes" @click="onToggleLike(workInfo)">
          <img v-if="!workInfo.favStatus" src="../../assets/heartstroke.svg" alt>
          <img v-if="workInfo.favStatus" src="../../assets/heartfill.svg" alt>
          <p>{{workInfo.collectNum}}</p>
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
.card {
  // display: inline-block;
  position: relative;
  width: getRem(670);
  height: getRem(920);
  margin: 0 auto getRem(16);
  border-radius: getRem(40);
  // margin-right: getRem(16);
  .mask {
    z-index: 2;
    padding: getRem(40 / 2);

    top: 0;
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
    border-radius: getRem(40) getRem(40) 0 0;
    height: getRem(758);
    background: linear-gradient(#585c63 0%, #36373b 100%);
    // background-size: 2rem;
    // opacity: 0.5;
    .work-content {
      position: absolute;
      left: getRem(40);
      top: getRem(40);
      color: white;
      opacity: 0.7;
      font-size: getRem(24);
      width: 40%;
      text-align: left;
      line-height: getRem(40);
    }
    .dark-mask {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: getRem(40) getRem(40) 0 0;
      overflow: hidden;
      background: url("../../assets/notes.svg") center center no-repeat;
      background-size: 3rem;
      opacity: 0.06;
    }
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
    .cover {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: getRem(40) getRem(40) 0 0;
    }
  }
  .detail {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: getRem(162);
    color: $gray-text;
    background-color: $dark-gray;
    text-align: left;
    padding: getRem(32) getRem(40) getRem(20);
    border-radius: 0 0 0.53333rem 0.53333rem;
    .title {
      font-size: getRem(32);
      color: #8c8c92;
      margin-bottom: getRem(16);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 5rem;
    }
    .basic-info {
      flex: 1;
      // display: flex;
      // align-items: center;
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
      .update-info {
        font-size: 12px;
        color: #6d6e75;
        opacity: 0.5;
      }
    }
    .download-info {
      display: flex;
      justify-content: space-between;
      // padding: getRem(40) getRem(16);
      padding-right: getRem(40);
      font-size: 10px;
      .likes {
        // display: flex;
        text-align: center;
        font-size: getRem(28);
        img {
          width: getRem(52);
          height: getRem(42);
          // margin-right: getRem(8);
        }
      }
    }
    .like-info {
      display: flex;
      justify-content: space-between;
      // padding: getRem(10) getRem(16);
      font-size: 10px;
      .likes {
        // display: flex;
        text-align: center;
        font-size: getRem(28);
        img {
          width: getRem(52);
          height: getRem(42);
          // margin-right: getRem(8);
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
