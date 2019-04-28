<script>
const MARQUEE_SPEED = 40;
export default {
  props: {
    workInfo: { type: Object },
    playingStatus: {
      type: Boolean,
      default: false
    },
    rank: { type: Number },
    onPlayWork: Function,
    onToggleLike: Function,
    onDownloadWork: Function
  },
  data() {
    return {
      marqueeStyle: ""
    };
  },
  methods: {
    gotoWork(id) {
      this.$router.push({
        path: "/new-music-box-viewer",
        query: {
          id
        }
      });
    }
  },
  created() {},
  mounted() {
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
      // console.log(this.$refs.insider.offsetWidth);
    }
  }
};
</script>

<template>
  <div v-if="workInfo.id" class="info">
    <div class="rank" :id="`rank${rank}`">{{rank}}</div>
    <div class="preview-bg" @touchend="onPlayWork">
      <img v-if="workInfo.cover.indexOf('//')>=0" class="cover" :src="workInfo.cover" alt>
      <div v-if="workInfo.cover.indexOf('//')<0" class="dark-mask"></div>
      <img class="playBtn" v-if="!playingStatus" src="../../assets/viewer/trans-play.png" alt>
      <img class="playBtn" v-if="playingStatus" src="../../assets/stop.svg" alt>
    </div>
    <div class="detail">
      <p class="title" @click="gotoWork(workInfo.id)">{{workInfo.title}}</p>
      <div ref="outsider" class="work-body-desc">
        <div
          style="position: absolute;right: -2rem;width: 4rem;background: linear-gradient(45deg, rgba(55, 60, 102, 0), rgba(55,60,102,60));height: 100%;z-index: 2;"
        ></div>
        <p ref="insider" :style="marqueeStyle">{{workInfo.content}}</p>
      </div>
      <div class="detail-other">
        <p class="user-detail">
          by&nbsp;
          <span>
            <img class="avatar" :src="workInfo.userVO.smallAvatar" alt>
          </span>
          <span class="name">&nbsp;{{workInfo.userVO.realname}}</span>
          <span>&nbsp;·{{workInfo.lastModifiedDate|getDateDiff}}</span>
        </p>
        <div class="likes" @click="onDownloadWork(workInfo)">
          <img v-if="!workInfo.wavAccess" src="../../assets/download1.svg" alt>
          <img v-if="workInfo.wavAccess" src="../../assets/download2.svg" alt>
          <!-- <p>wav</p> -->
        </div>
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
.info {
  display: flex;
  align-items: stretch;
  width: getRem(686);
  height: getRem(186);
  margin-bottom: getRem(20);
  justify-content: space-between;
  background-color: #373c66;
  color: white;
  /*margin: .4rem 0 .6rem;*/
  .rank {
    position: relative;
    width: getRem(40);
    background-color: #6f737b;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #rank1 {
    background-color: #ffcf8b;
  }
  #rank2 {
    background-color: #d2d2d2;
  }
  #rank3 {
    background-color: #bb9d94;
  }
  .preview-bg {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: getRem(186);
    height: getRem(186);
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
  .detail {
    position: relative;
    flex: 1;
    background-color: #373c66;
    color: $gray-text;
    text-align: left;
    padding: 0 getRem(24);
    .title {
      font-size: getRem(32);
      line-height: getRem(80);
      color: white;
      white-space: nowrap;
      position: relative;
    }
    .work-body-desc {
      font-size: getRem(24);
      width: 5rem;
      height: 0.8rem;
      overflow: hidden;
      position: relative;
      p {
        position: absolute;
        white-space: nowrap;
      }
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
      // padding: 0 getRem(16);
      font-size: 10px;
      .user-detail {
        display: flex;
        align-items: center;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        .avatar {
          width: 0.4rem;
          height: 0.4rem;
          border-radius: 0.2rem;
        }
        .name {
        }
      }
      .likes {
        display: flex;
        align-items: center;
        padding-left: 0.25rem;
        img {
          width: getRem(26);
          height: getRem(22);
          margin-right: getRem(8);
        }
      }
    }
  }
}
</style>
