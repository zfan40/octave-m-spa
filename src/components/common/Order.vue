<script>
export default {
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
  // }
  props: {
    info: Object,
    playingStatus: {
      type: Boolean,
      default: false
    },
    onPlayWork: Function,
    onPayOrder: Function
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
    updateButton() {}
  }
};
</script>

<template>
  <div v-if="info.content && info.content.product" class="order-container">
    <div class="preview-bg">
      <img class="cover" :src="info.content.product.previewPic" alt>
      <div v-if="info.content.product.category!==100" class="shipment">
        <img v-if="info.status===1" class="statusProcess" src="../../assets/123-0.png" alt>
        <p v-if="info.status===1" class="statusText" @click="onPayOrder">去支付</p>
        <img v-if="info.status===2" class="statusProcess" src="../../assets/123-1.png" alt>
        <p v-if="info.status===2" class="statusText">制作中👷</p>
        <img v-if="info.status===3" class="statusProcess" src="../../assets/123-2.png" alt>
        <p v-if="info.status===3" class="statusText">派送中🏍️</p>
        <img v-if="info.status===4" class="statusProcess" src="../../assets/123-3.png" alt>
        <p v-if="info.status===4" class="statusText">已收件🎁</p>
      </div>
      <div v-if="info.content.product.category===100" class="shipment">
        <p v-if="info.status===1" class="statusText" @click="onPayOrder">去支付</p>
        <p v-if="info.status===2" class="statusText">制作中👷</p>
        <p v-if="info.status===3" class="statusText">派送中🏍️</p>
        <p v-if="info.status===4" class="statusText">已下载🎁</p>
      </div>
    </div>
    <div class="detail">
      <div class="detail-basic">
        <div class="title">
          <p class="product-name">{{info.content.product.name}}</p>
          <p class="song-title">{{info.content.title}}</p>
        </div>
        <div :class="playingStatus?'stopBtn':'playBtn'" @touchend="onPlayWork"></div>
      </div>
      <div class="detail-other">
        <p>{{info.orderTime|getDateDiff}}下单</p>
        <p>¥{{info.price}}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../_common/style/_functions.scss";
@import "../../_common/style/_variables.scss";
@import "../../_common/style/_mixins.scss";
@import "../../_common/style/_reboot.scss";
.order-container {
  display: inline-block;
  position: relative;
  width: getRem(342);
  height: getRem(348);
  margin-bottom: getRem(16);
  .preview-bg {
    position: relative;
    width: 100%;
    height: getRem(208);
    .cover {
      position: absolute;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .shipment {
      position: absolute;
      background-color: $img-mask;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      .statusProcess {
        width: getRem(204);
        height: getRem(28);
      }
      .statusText {
        font-size: 14px;
        color: white;
      }
    }
  }
  .detail {
    position: relative;
    width: 100%;
    height: getRem(140);
    background-color: $dark-gray;
    color: $gray-text;
    .detail-basic {
      display: flex;
      position: relative;
      height: getRem(90);
      width: 100%;
      padding: getRem(16);
      align-items: center;
      .title {
        flex: 1;
        text-align: left;
        .product-name {
          font-size: 14px;
        }
        .song-title {
          font-size: 12px;
        }
      }
      .playBtn {
        background: url("../../assets/play.svg") no-repeat center center;
        background-size: cover;
        color: yellow;
        width: getRem(30);
        height: getRem(30);
      }
      .stopBtn {
        background: url("../../assets/stop.svg") no-repeat center center;
        background-size: cover;
        color: yellow;
        width: getRem(30);
        height: getRem(30);
      }
    }
    .detail-other {
      display: flex;
      justify-content: space-between;
      padding: getRem(10) getRem(16);
      font-size: 10px;
    }
  }
}
</style>
