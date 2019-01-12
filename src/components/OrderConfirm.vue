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
    }
  },
  data() {
    return {
      currentActiveCount: 0,
      currentActive: false
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
  methods: {
    createOrder() {
      WxShare.newMakeWxOrder(
        { pid: 1, wid: this.projectInfo.id, amount: 1 },
        () => {
          console.log("pay succeed");
        },
        () => {
          console.log("pay fail");
        }
      );
    }
  }
};
</script>

<template>
  <div class="orderConfirm" @click="viewProductDetail">
    <div class="address">
      收件人：
      <span>小白</span>
      <span>178888821283</span>
      收件地址：
    </div>
    <div class="item"></div>
    <div class="item-list"></div>
    <div class="msg"></div>
    <div class="readme"></div>
    <button @click="createOrder">买起</button>
  </div>
</template>

<style lang="scss" scoped>
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";
.productPage {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.btnContainer {
  position: relative;
  width: getRem(92);
  height: getRem(92);
  border: 1px solid #7d839e;
  border-radius: 50%;
  overflow: hidden;
  // -webkit-mask-image: -webkit-radial-gradient(circle, white, black);
  .active-btn-background {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #7d839e;
    border-radius: 50%;
    border: none;
    overflow: hidden;
  }
  .active {
    // background-color:#7D839E;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    color: white;
    align-items: center;
    justify-content: space-around;
    div {
      width: getRem(34);
      height: getRem(24);
      margin-top: 0.2rem;
      background: url("../assets/viewer/icon-like.png") center center no-repeat;
      background-size: cover;
    }
    p {
      font-size: 0.37rem;
      margin: 0 0 0.1rem 0;
      line-height: 0.37rem;
      color: white;
    }
  }
  .inactive {
    // background-color:blue;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    color: white;
    align-items: center;
    justify-content: space-around;
    div {
      width: getRem(34);
      height: getRem(24);
      margin-top: 0.2rem;
      background: url("../assets/viewer/icon-like-gray.png") center center
        no-repeat;
      background-size: cover;
    }
    p {
      font-size: 0.37rem;
      margin: 0 0 0.1rem 0;
      line-height: 0.37rem;
      color: #7d839e;
    }
  }
}
//
.slideDown-enter-active {
  transition: all 0.3s ease-out;
}
.slideDown-leave-active {
  transition: all 0.3s ease-out;
}
.slideDown-enter,.slideDown-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateY(100%);
  opacity: 0;
}
.slideUp-enter-active {
  transition: all 0.3s ease-out;
}
.slideUp-leave-active {
  transition: all 0.3s ease-out;
}
.slideUp-enter,.slideUp-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateY(-100%);
  opacity: 0;
}
.fade-enter-active {
  transition: all 0.3s ease-out;
}
.fade-leave-active {
  transition: all 0.3s ease-out;
}
.fade-enter, .fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
