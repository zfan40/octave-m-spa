<script>
import * as WxShare from "../_common/js/wx_share";

export default {
  // https://vuejs.org/v2/guide/components.html#Props
  props: {
    initCount: Number,
    initActive: Boolean,
    iconImg: String
  },
  computed: {
    style() {
      // return 'background-color: ' + this.hovering ? this.color: 'red';
    },
    orderToCreate() {
      return this.$store.state.orderToCreate;
    },
    targetProduct() {
      return this.$store.state.targetProduct;
    },
    targetWork() {
      return this.$store.state.targetWork;
    }
  },
  data() {
    return {
      amount: 1,
      giftMsg: "",
      currentActiveCount: 0,
      currentActive: false,
      userName: "",
      telNum: "",
      address: ""
    };
  },
  watch: {},
  created() {
    this.currentActive = this.initActive;
    this.currentActiveCount = this.currentActive
      ? this.initCount
      : this.initCount + 1;
  },
  mounted() {},
  updated() {},
  beforeRouteEnter(to, from, next) {
    // i think need check here, e.g. cookie address
    next();
  },
  methods: {
    toConfirmOrder() {
      // passin orderToCreate TODO
      if (!this.address) {
        alert("请先填入地址");
      } else {
        console.log(this.orderToCreate);
        WxShare.makeWxOrder(
          { ...this.orderToCreate, amount: this.amount, message: this.giftMsg },
          () => {
            this.$toast("下单成功");
            this.$router.push({
              path: "/my-orders"
            });
          },
          () => {
            this.$toast("未下单");
            this.$router.push({
              path: "/my-orders"
            });
          }
        );
      }
    },
    positionWindow() {
      window.scroll(0, 0);
    },
    editAddress() {
      //都是同步操作
      WxShare.createAddress(
        address => {
          this.address = address.detailInfo;
          this.userName = address.userName;
          this.telNum = address.telNumber;
          this.$store.commit("SAVE_ORDER_INFO", { address });
        },
        () => {}
      );
    },
    addAmount() {
      this.amount < 9 ? (this.amount += 1) : "";
    },
    reduceAmount() {
      this.amount > 1 ? (this.amount -= 1) : "";
    }
  }
};
</script>

<template>
  <div class="container">
    <div class="order-confirm">
      <div class="address" @click="editAddress">
        <div id="basic-info">
          收件人：
          <span>{{userName}}</span>
          <span style="flex:1">{{telNum}}</span>
        </div>
        <div id="address-info">
          收件地址：
          <span>{{address}}</span>
          <div class="address-underline" id="underline1"></div>
          <div class="address-underline" id="underline2"></div>
        </div>
      </div>
    </div>
    <div class="item">
      <img
        class="product-img"
        :src="targetProduct.previewPic||'https://cdn4.buysellads.net/uu/1/3386/1525189887-61450.png'"
        alt
      >
      <div class="goods">
        <p class="sub-title">{{targetProduct.name}}</p>
        <p class="work-title">{{targetWork.title}}</p>
      </div>
      <div class="amount">
        <span @click="reduceAmount">-</span>
        <input v-model.number="amount" @blur="positionWindow" type="number">
        <span @click="addAmount">+</span>
      </div>
    </div>
    <div style="margin: 0 0.64rem;">
      <div class="thinline"></div>
    </div>

    <div class="item-list">
      <p class="sub-title">商品清单</p>
      <div class="sub-detail">
        <p>八音盒 x 1</p>
        <p>包装盒 x 1</p>
        <p>礼品卡 x 1</p>
      </div>
    </div>
    <div class="msg">
      <input
        v-model="giftMsg"
        @blur="positionWindow"
        type="text"
        placeholder="默认祝福语：「在乐音相伴的梦里，世界一片白银」"
      >
    </div>
    <div class="readme">购买说明
      <ul>
        <li>· 此商品的制作周期约为7天，您可以在【我的-八音盒】页面查看进度</li>
        <li>· 定制商品非质量问题不得退换货，如需退货请在公众号页面提交申请</li>
        <li>· 如有其他疑问可在公众号的【留言】版块留言，我们将尽快为您解答</li>
      </ul>
    </div>
    <div
      style="position:absolute;bottom:40px;width:100%;display: flex;align-items: center;justify-content: center;"
    >
      <div class="purchaseBtn" @click="toConfirmOrder">付款 ¥{{amount*targetProduct.price}}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
.container {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: $darker-gray;
}
.order-confirm {
  position: relative;
}
.address {
  position: relative;
  width: getRem(654);
  height: getRem(264);
  background-color: #2c2d30;
  margin: getRem(32) auto getRem(24);
  text-align: left;
  padding-left: getRem(24);
  #basic-info {
    position: relative;
    color: #8c8c92;
    display: flex;
    font-size: 14px;
    width: 100%;
    height: getRem(100);
    padding-top: getRem(32);
  }
  #address-info {
    position: relative;
    color: #6d6e75;
    font-size: 12px;
    width: 100%;
    height: getRem(100);
    .address-underline {
      position: absolute;
      width: getRem(400);
      height: 1px;
      transform: scaleY(0.5);
      background-color: #d8d8d8;
    }
    #underline1 {
      left: getRem(144);
      top: 0.5rem;
    }
    #underline2 {
      left: getRem(144);
      top: 1.5rem;
    }
  }
}
.thinline {
  position: relative;
  width: 100%;
  height: 1px;
  transform: scaleY(0.5);
  background-color: #d8d8d8;
}
.item {
  position: relative;
  width: getRem(644);
  height: getRem(128);
  display: flex;
  margin: getRem(24) getRem(48) getRem(32);
  align-items: center;
  // border-bottom: 1px solid #d8d8d8;
  .product-img {
    width: getRem(128);
    height: getRem(128);
    margin-right: getRem(42);
  }
  .goods {
    flex: 1;
    text-align: left;
    color: #8c8c92;
    .sub-title {
      font-size: getRem(36);
      margin-bottom: getRem(32);
    }
    .work-title {
      font-size: getRem(24);
    }
  }
  .amount {
    color: #8c8c92;
    width: getRem(150);
    height: getRem(50);
    line-height: getRem(50);
    border: 1px solid #8c8c92;
    border-radius: getRem(25);
    font-size: getRem(20);
    display: flex;
    span {
      width: getRem(30);
    }
    input {
      width: getRem(90);
      color: #8c8c92;
      text-align: center;
    }
  }
}
.productPage {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.purchaseBtn {
  background-color: #4564d7;
  width: getRem(640);
  height: getRem(92);
  font-size: 16px;
  color: white;
  text-align: center;
  line-height: getRem(92);
  border-radius: getRem(46);
}
.readme {
  margin: 0 getRem(48);
  color: #6d6e75;
  text-align: left;
  font-size: getRem(20);
  ul {
    list-style: none;
    padding: 0;
  }
}
// reset
input {
  -webkit-appearance: none;
  -moz-appearance: none;
  -o-appearance: none;
  appearance: none;
  background: none;
  border: 0;
}
.msg {
  padding: getRem(22) 0;
  margin: getRem(16) getRem(48) getRem(72);
  border: 1px solid #979797;
  font-size: getRem(24);
  // transform: scale(0.5);
  // position: absolute;
  // top: -50%;
  // right: -50%;
  // bottom: -50%;
  // left: -50%;
  input {
    width: 100%;
    text-align: left;
    padding-left: getRem(22);
    color: white;
  }
}
.item-list {
  margin-top: getRem(18);
  text-align: left;
  margin-left: getRem(48);
  .sub-title {
    color: #6d6e75;
    font-size: getRem(24);
    margin-bottom: getRem(32);
  }
  .sub-detail {
    color: #6d6e76;
    font-size: getRem(28);
  }
}
</style>
