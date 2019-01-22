<script>
import * as Util from "../_common/js/util";
import * as Api from "../_common/js/api";
import * as Cookies from "js-cookie";
import order from "./common/Order";

export default {
  name: "myorders",
  components: {
    order
  },
  data() {
    return {
      msg: "Welcome to Your Vue.js App",
      orderList: [
        {
          id: 130,
          price: 0.01,
          status: 2,
          shipTime: 1547705540000,
          confirmTime: 1547734350000,
          userId: 0,
          amount: 1,
          product: {
            wid: 148,
            product: {
              id: 1,
              category: 0,
              name: "产品名01",
              intro: "八音盒",
              price: 0.01,
              status: 0,
              createdDate: 1545545048000
            },
            title: "castle",
            userId: 239,
            url: "//img.musixise.com/LIjPhuhF_castle.mid"
          },
          address: {
            id: 2,
            userId: 239,
            userName: "花",
            postalCode: "100032",
            provinceName: "北京市",
            cityName: "北京市",
            countryName: "西城区",
            detailInfo: "哈哈哈哈哈哈哈",
            nationalCode: "110102",
            telNumber: "13146319393"
          }
        },
        {
          id: 129,
          price: 0.01,
          status: 1,
          shipTime: 1547704912000,
          confirmTime: null,
          userId: 0,
          amount: 1,
          product: {
            wid: 148,
            product: {
              id: 1,
              category: 0,
              name: "产品名01",
              intro: "八音盒",
              price: 0.01,
              status: 0,
              createdDate: 1545545048000
            },
            title: "castle",
            userId: 239,
            url: "//img.musixise.com/LIjPhuhF_castle.mid"
          },
          address: {
            id: 1,
            userId: 239,
            userName: "郑一花",
            postalCode: "100101",
            provinceName: "北京市",
            cityName: "北京市",
            countryName: "朝阳区",
            detailInfo: "北京绿城诚园52601\n\n",
            nationalCode: "110105",
            telNumber: "18501235898"
          }
        },
        {
          id: 128,
          price: 0.01,
          status: 1,
          shipTime: 1547704864000,
          confirmTime: null,
          userId: 0,
          amount: 1,
          product: {
            wid: 148,
            product: {
              id: 1,
              category: 0,
              name: "产品名01",
              intro: "八音盒",
              price: 0.01,
              status: 0,
              createdDate: 1545545048000
            },
            title: "castle",
            userId: 239,
            url: "//img.musixise.com/LIjPhuhF_castle.mid"
          },
          address: {
            id: 1,
            userId: 239,
            userName: "郑一花",
            postalCode: "100101",
            provinceName: "北京市",
            cityName: "北京市",
            countryName: "朝阳区",
            detailInfo: "北京绿城诚园52601\n\n",
            nationalCode: "110105",
            telNumber: "18501235898"
          }
        }
      ]
    };
  },
  computed: {
    orders() {
      return this.$store.state.recordProject;
    },
    projectInfo() {
      return this.$store.state.recordProjectInfo;
    }
  },
  methods: {
    redirectTo(path) {
      // IMPORTANT keng. 从主页跳制作页，如果相对路径会带上参数，比如auth回来的code会一直带着，污染之后的auth
      // 成功auth一次，就写入cookie了，所以往后跳就直接给全路径，摒弃微信弄回来的乱七八糟的参数
      this.$router.push(path);
    }
  },
  created() {
    var docElem = document.documentElement;
    window.rem = docElem.getBoundingClientRect().width / 10;
    docElem.style.fontSize = window.rem + "px";

    const inWechat = /micromessenger/.test(navigator.userAgent.toLowerCase());
    if (!inWechat) return;
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
          alert(`welcome${res.data.data.realname}`);
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
    <order v-for="(order,index) in orderList" v-bind:info="order" v-bind:key="order.id"></order>
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
  padding: getRem(32) 0 getRem(46) getRem(26);
  position: absolute;
  text-align: left;
  width: 100%;
  height: 100%;
  background-color: $darker-gray;
  // display: flex;
  // flex-direction: row;
  // overflow: scroll;
  // flex-wrap: wrap;
  // justify-content: space-between; //挨两头
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
