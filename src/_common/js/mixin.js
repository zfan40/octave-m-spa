import * as Magic from "./magic";
import * as Api from "./api";
export const mbMixin = {
  data() {
    return {
      everPlayFlag: false,
      playing: false,
    };
  },
  methods: {
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
        query: {}
      });
    },
    toggleLike(work, type) {
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
          type,
          item: {
            id: work.id,
            favStatus: +!work.favStatus
          }
        });
      });
    },
    playWork(work) {
      if (!work) return
      this.everPlayFlag = true;
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
  }
}