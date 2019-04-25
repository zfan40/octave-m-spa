<script>
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import order from "./common/Order";
import infiniteScroll from "vue-infinite-scroll";
import * as Magic from "../_common/js/magic";
import * as WxShare from "../_common/js/wx_share";

export default {
  name: "myorders",
  directives: {
    infiniteScroll
  },
  components: {
    order
  },
  data() {
    return {
      busy: false
      // orders: [
      // {
      //   id: 130,
      //   price: 0.01,
      //   status: 2,
      //   shipTime: 1547705540000,
      //   confirmTime: 1547734350000,
      //   userId: 0,
      //   amount: 1,
      //   content: {
      //     wid: 148,
      //     product: {
      //       id: 1,
      //       category: 0,
      //       name: "产品名01",
      //       intro: "八音盒",
      //       price: 0.01,
      //       previewPic: "//img.musixise.com/BP32nt9X_5.jpg",
      //       previewVideo: "",
      //       status: 0,
      //       createdDate: 1545545048000
      //     },
      //     title: "castle",
      //     userId: 239,
      //     url: "//img.musixise.com/LIjPhuhF_castle.mid"
      //   },
      //   address: {
      //     id: 2,
      //     userId: 239,
      //     userName: "花",
      //     postalCode: "100032",
      //     provinceName: "北京市",
      //     cityName: "北京市",
      //     countryName: "西城区",
      //     detailInfo: "哈哈哈哈哈哈哈",
      //     nationalCode: "110102",
      //     telNumber: "13146319393"
      //   }
      // },
      // {
      //   id: 129,
      //   price: 0.01,
      //   status: 1,
      //   shipTime: 1547704912000,
      //   confirmTime: null,
      //   userId: 0,
      //   amount: 1,
      //   content: {
      //     wid: 148,
      //     product: {
      //       id: 1,
      //       category: 0,
      //       name: "产品名01",
      //       intro: "八音盒",
      //       price: 0.01,
      //       previewPic: "//img.musixise.com/BP32nt9X_5.jpg",
      //       previewVideo: "",
      //       status: 0,
      //       createdDate: 1545545048000
      //     },
      //     title: "castle",
      //     userId: 239,
      //     url: "//img.musixise.com/LIjPhuhF_castle.mid"
      //   },
      //   address: {
      //     id: 1,
      //     userId: 239,
      //     userName: "郑一花",
      //     postalCode: "100101",
      //     provinceName: "北京市",
      //     cityName: "北京市",
      //     countryName: "朝阳区",
      //     detailInfo: "北京绿城诚园52601\n\n",
      //     nationalCode: "110105",
      //     telNumber: "18501235898"
      //   }
      // },
      // {
      //   id: 128,
      //   price: 0.01,
      //   status: 1,
      //   shipTime: 1547704864000,
      //   confirmTime: null,
      //   userId: 0,
      //   amount: 1,
      //   content: {
      //     wid: 148,
      //     product: {
      //       id: 1,
      //       category: 0,
      //       name: "产品名01",
      //       intro: "八音盒",
      //       price: 0.01,
      //       status: 0,
      //       createdDate: 1545545048000
      //     },
      //     title: "castle",
      //     userId: 239,
      //     url: "//img.musixise.com/LIjPhuhF_castle.mid"
      //   },
      //   address: {
      //     id: 1,
      //     userId: 239,
      //     userName: "郑一花",
      //     postalCode: "100101",
      //     provinceName: "北京市",
      //     cityName: "北京市",
      //     countryName: "朝阳区",
      //     detailInfo: "北京绿城诚园52601\n\n",
      //     nationalCode: "110105",
      //     telNumber: "18501235898"
      //   }
      // }
      // ]
    };
  },
  computed: {
    orders() {
      return this.$store.state.orders;
    },
    playingWorkId() {
      return this.$store.state.playingWorkId;
    }
  },

  methods: {
    redirectTo(path) {
      // IMPORTANT keng. 从主页跳制作页，如果相对路径会带上参数，比如auth回来的code会一直带着，污染之后的auth
      // 成功auth一次，就写入cookie了，所以往后跳就直接给全路径，摒弃微信弄回来的乱七八糟的参数
      this.$router.push(path);
    },
    loadMore() {
      //will call automatically when enter!
      // alert(id)
      // alert(12345);
      this.busy = true;
      console.log("1111111");
      this.$store
        .dispatch("FETCH_ORDERS", {
          page: this.orders.current ? this.orders.current + 1 : 1
        })
        .then(() => {
          console.log("2222222", this.orders);
          // alert(this.orders.content.length);
          // alert(this.orders.total);
          if (+this.orders.content.length < +this.orders.total) {
            this.busy = false;
          }
        });
    },
    payOrder(orderId) {
      WxShare.payWxOrder(
        { orderId },
        () => {
          this.$toast("下单成功");
          this.$store.commit("LOCAL_UPDATE_ORDER_STATUS", {
            orderId,
            status: 2
          });
        },
        () => {}
      );
    },
    playWork(work) {
      if (!work.content) {
        this.$toast("作品损坏，无法播放");
        return;
      }
      console.log("work going to play: ", work);
      work.id = work.wid; //简单转换一下
      if (work.id != this.playingWorkId) {
        this.$ga.event("Song", "play_20s", `${work.id}`);
        this.playing = true;
        Magic.previewMidi(work.url, this.playing)
          .then(() => this.$store.commit("PLAY_WORK", { work }))
          .catch(() => {
            this.$toast("作品损坏，无法播放");
          });
      } else {
        //操作的同一个
        if (this.playing) {
          this.$ga.event("Song", "stop_20s", `${work.id}`);
          //正播着这个呢
          this.playing = false;
          Magic.previewMidi(work.url, this.playing)
            .then(() => this.$store.commit("PLAY_WORK", { work: { id: -1 } }))
            .catch(() => {
              this.$toast("作品损坏，无法播放");
            });
        } else {
          this.$ga.event("Song", "play_20s", `${work.id}`);
          //这个已经被停了
          this.playing = true;
          Magic.previewMidi(work.url, this.playing)
            .then(() => this.$store.commit("PLAY_WORK", { work }))
            .catch(() => {
              this.$toast("作品损坏，无法播放");
            });
        }
      }
    }
  },
  created() {
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + "px";
    this.busy = true; //important： disable auto loadmore at create, call loadmore manually after user auth
    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) {
      this.busy = false;
      return;
    }
    document.title = "我的订单";
    if (Util.getUrlParam("code") || Cookies.get("serviceToken")) {
      //TODO:ajax call to get info
      Api.getUserInfo(Util.getUrlParam("code"))
        .then(res => {
          if (res.data.errcode >= 20000) {
            // 网页内cookie失效，需要重新验证
            Cookies.remove("serviceToken");
            location.replace(
              "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect"
            );
          }
          // alert(`welcome${res.data.data.realname}`);
          this.loadMore();
          console.log("get user info success", res.data.data);
        })
        .catch(err => {
          Cookies.remove("serviceToken");
          location.replace(
            "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect"
          );
        });
    } else {
      //又没有微信给的auth code又没有token存在cookie，只得验证
      location.replace(
        "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx353a60a8b049d366&redirect_uri=http://m.musixise.com/music-box&response_type=code&scope=snsapi_userinfo&state=type&quan,url=http://m.musixise.com/music-box&connect_redirect=1#wechat_redirect"
      );
    }
  }
};
</script>

<template>
  <div class="container">
    <div
      v-infinite-scroll="loadMore"
      infinite-scroll-disabled="busy"
      infinite-scroll-distance="10"
      class="orderlist"
    >
      <order
        v-for="(order,index) in orders.content"
        v-bind:info="order"
        v-bind:key="order.id"
        :playingStatus="order.content?order.content.wid==playingWorkId:false"
        :onPlayWork="()=>playWork(order.content)"
        :onPayOrder="()=>payOrder(order.orderId)"
      ></order>
    </div>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.container {
  // padding: getRem(32) 0 getRem(46) getRem(26);
  // position: absolute;
  // text-align: left;
  // width: 100%;
  // height: 100%;
  // background-color: $darker-gray;
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  background-color: #404249;
}
.orderlist {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-content: flex-start;
  padding: getRem(24);
  background-color: #404249;
  overflow: scroll;
  -webkit-overflow-scrolling: touch;
}
.m-logo {
  position: absolute;
  width: getRem(200);
  height: getRem(200);
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: url("//gw.alicdn.com/tps/TB1pfhUOFXXXXaSaXXXXXXXXXXX-350-350.png")
    no-repeat center center;
  background-size: getRem(175) getRem(175);
  background-color: #ffcc33;
  border-radius: getRem(25);
  animation: toupperleftwithsize 4.5s linear;
  -webkit-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
  z-index: 2;
}
.redirect-button {
  width: getRem(450);
  height: getRem(100);
  padding: getRem(20) getRem(50);
  background-color: #ffcc33;
  border-radius: getRem(10);
  color: gray;
}
.redirect-button,
#mb-maker {
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.57rem;
}
</style>
