

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
      <img
        class="cover"
        :src="workInfo.cover||'https://cdn4.buysellads.net/uu/1/3386/1525189887-61450.png'"
        alt
      >
      <p>{{workInfo.content}}</p>
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
      <p class="title" @click="gotoWork(workInfo.id)">{{workInfo.title}}</p>
      <div class="user" @click="gotoMusixiser(workInfo.userId)">
        <img class="avatar" :src="workInfo.userVO.smallAvatar" alt>
        <p class="song-title">{{workInfo.userVO.realname}}</p>
      </div>
      <div class="detail-other">
        <div>更新于{{(workInfo.lastModifiedDate||workInfo.createdDate)|getDateDiff}}</div>
        <div class="likes" @click="onToggleLike(workInfo)">
          <img v-if="!workInfo.favStatus" src="../../assets/viewer/strokeheart.svg" alt>
          <img v-if="workInfo.favStatus" src="../../assets/viewer/fillheart.svg" alt>
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
.card {
  width: getRem(325 * 2);
  height: getRem(530 * 2);
  position: relative;
  box-shadow: 0 2px 2px rgb(20, 45, 44);
  background: rgb(44, 45, 48);
  border-radius: getRem(50);
  .mask {
    z-index: 2;
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
    height: getRem(208);
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
    }
  }
  .detail {
    position: relative;
    width: 100%;
    background-color: $dark-gray;
    color: $gray-text;
    text-align: left;
    padding: getRem(16);
    .title {
      font-size: getRem(28);
      color: #8c8c92;
    }
    .user {
      display: flex;
      align-items: center;
      margin-bottom: getRem(16);
      .avatar {
        width: getRem(46);
        height: getRem(46);
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
