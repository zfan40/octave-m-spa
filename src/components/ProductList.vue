<script>
import { swiper, swiperSlide } from "vue-awesome-swiper";
export default {
  // https://vuejs.org/v2/guide/components.html#Props
  props: {
    initCount: Number,
    initActive: Boolean,
    iconImg: String,
    onClickCall: {
      type: Function,
      default() {
        return function() {
          console.log("tap tap in count Button");
        };
      }
    }
  },
  components: {
    swiper,
    swiperSlide
  },
  computed: {
    style() {
      // return 'background-color: ' + this.hovering ? this.color: 'red';
    },
    productList() {
      return this.$store.state.productList;
    }
  },
  data() {
    return {};
  },
  watch: {},
  created() {
    const self = this;
    this.productListOption = {
      loop: true,
      // spaceBetween: 30,
      centeredSlides: true,
      slidesPerView: 1,
      // slidesPerView: "auto",
      on: {
        transitionEnd(e) {
          // console.log("3", this.activeIndex); // THIS!!! within swiper...scope.....
          console.log(this.realIndex);
          self.targetProduct = self.productList[this.realIndex];
        }
      }
    };
  },
  mounted() {},
  updated() {},
  methods: {
    viewProductDetail() {},
    toConfirmOrder() {
      console.log(123321);
      this.$store.commit("SAVE_ORDER_INFO", {
        product: this.targetProduct
      }); // store current workId
      this.$router.push({
        path: "/order-confirm",
        query: {
          // id
        }
      });
    }
  }
};
</script>

<template>
  <div class="container">
    <swiper :options="productListOption" ref="productList">
      <!-- slides -->
      <swiper-slide v-for="product in productList">
        <div class="productPage" @click="viewProductDetail">
          <div class="preview" :style="{background:`url()`}">
            <img
              style="width:100%;height:100%;position:relative;display:block;"
              :src="product.previewImg||'https://cdn4.buysellads.net/uu/1/3386/1525189887-61450.png'"
              alt
            >
          </div>
          <div class="desc">
            <div class="desc-title">{{product.name}}</div>
            <div style="display:flex">
              <div style="flex:1;color:#6d6e75;font-size:12px;">
                <p>大小:20*30*40 (cm)</p>
                <p>{{product.intro}}</p>
              </div>
              <div class="price">¥{{product.price}}</div>
            </div>
          </div>
        </div>
      </swiper-slide>
    </swiper>
    <div
      style="position:absolute;bottom:40px;width:100%;display: flex;align-items: center;justify-content: center;"
    >
      <div class="purchaseBtn" @click="toConfirmOrder">购买</div>
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
  background-color: #1a1c1e;
  .swiper-slide div {
    // position: absolute;
  }
}
.productPage {
  position: relative;
  width: getRem(638);
  height: getRem(744);
  border-radius: 20px;
  margin: 80px auto;
  .preview {
    position: relative;
    width: 100%;
    border-radius: 20px 20px 0 0;
    height: getRem(456);
    background-color: #d8d8d8;
  }
  .desc {
    position: relative;
    width: 100%;
    height: getRem(288);
    background-color: #2c2d30;
    border-radius: 0 0 20px 20px;
    text-align: left;
    padding-left: getRem(48);
    .desc-title {
      color: #a3a4a8;
      font-size: 18px;
      line-height: getRem(144);
    }
    .price {
      width: 3rem;
      font-size: 24px;
      color: #a3a4a8;
      text-align: right;
      padding-right: getRem(48);
    }
  }
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
</style>
