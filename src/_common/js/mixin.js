import * as Magic from "./magic";
import * as Api from "./api";
import * as WxShare from './wx_share';

export const mbMixin = {
  data() {
    return {
      autoplayFlag: false,
      playing: false,
    };
  },
  methods: {
    genWav(work) {
      this.$loading("正在生成..请耐心等待,下单后可重复下载");
      Tone.Transport.stop(0);
      Magic.bounceAsWavBlob(work.url)
        .then(blob => {
          return Api.downloadAsWav(blob);
        })
        .then(url => {
          // this.$toast(`url is ${url}`);
          this.$ga.event("Download", "success", `${work.id}`);
          this.$loading.close();
          location.href = url;
        })
        .catch(() => {
          this.$loading.close();
          this.$toast("下载失败请稍后再试");
        });
    },
    downloadWork(work) {
      if (!work.id) work.id = work.wid //说明是从订单过来的，订单的作品id是wid不是id
      if (!work || !work.url) {
        this.$toast('作品文件缺失')
        return;
      }
      this.$ga.event("Download", "tap", `${work.id}`);
      // TODO, need check first
      this.$loading("请稍后");
      Api.checkOrder({ wid: work.id }).then(res => {
        if (res.data.data) {
          this.$loading.close();
          this.genWav(work)
        } else {
          WxShare.makeWavWxOrder({ wid: work.id },
            () => {
              this.$loading.close();
              this.$toast("下单成功");
              this.genWav(work);
            },
            () => {
              this.$loading.close();
              this.$toast("停止生成");
            }
          );
        }
      }).catch(() => {
        this.$loading.close();
        // this.$toast("停止生成");
      })
    },
    purchaseWork(work) {
      this.$ga.event("MakeMB", "tap", `${work.id}`);
      this.$toast("该功能近期开放,敬请期待~");
      return;
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
      if (!work.favStatus)
        this.$ga.event("Song", "fav", `${work.id}`);
      else this.$ga.event("Song", "unfav", `${work.id}`);
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

      console.log("work going to play: ", work);
      if (work.id != this.playingWorkId) {
        this.autoplayFlag = true;
        this.$ga.event("Song", "play_20s", `${work.id}`);
        this.playing = true;
        Magic.previewMidi(work.url, this.playing)
          .then(() => this.$store.commit("PLAY_WORK", { work }))
          .catch(() => { this.$toast('作品损坏，无法播放') });
      } else {
        //操作的同一个
        if (this.playing) {
          //正播着这个呢
          this.$ga.event("Song", "stop_20s", `${work.id}`);
          this.autoplayFlag = false;
          this.playing = false;
          Magic.previewMidi(work.url, this.playing)
            .then(() => this.$store.commit("PLAY_WORK", { work: { id: -1 } }))
            .catch(() => { this.$toast('作品损坏，无法播放') });
        } else {
          //这个已经被停了
          this.$ga.event("Song", "play_20s", `${work.id}`);
          this.autoplayFlag = true;
          this.playing = true;
          Magic.previewMidi(work.url, this.playing)
            .then(() => this.$store.commit("PLAY_WORK", { work }))
            .catch(() => { this.$toast('作品损坏，无法播放') });
        }
      }
    },
  }
}