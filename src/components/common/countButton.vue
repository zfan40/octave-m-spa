<script>
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
  computed: {
    style() {
      // return 'background-color: ' + this.hovering ? this.color: 'red';
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
    updateButton() {
      // if (this.currentActive) {
      //   this.currentActiveCount -= 1;
      // } else {
      //   this.currentActiveCount += 1;
      // }
      this.currentActive = !this.currentActive;
      this.onClickCall();
    }
  }
};
</script>

<template>
  <div class="btnContainer" @click="updateButton">
    <transition name="fade">
      <div class="active-btn-background" v-show="currentActive"></div>
    </transition>
    <transition name="slideDown">
      <div class="btn active" v-show="currentActive">
        <img src="../../assets/heartfill.svg" class="heart">
        <p>{{currentActiveCount}}</p>
      </div>
    </transition>
    <transition name="slideUp">
      <div class="btn inactive" v-show="!currentActive">
        <img src="../../assets/heartstroke.svg" class="heart">
        <p>{{currentActiveCount-1}}</p>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@import "../../_common/style/_functions.scss";
@import "../../_common/style/_variables.scss";
@import "../../_common/style/_mixins.scss";
@import "../../_common/style/_reboot.scss";
.btnContainer {
  position: relative;
  width: getRem(92);
  height: getRem(68);
  // border: 1px solid #7d839e;
  // border-radius: 50%;
  overflow: hidden;
  // -webkit-mask-image: -webkit-radial-gradient(circle, white, black);
  .active-btn-background {
    position: absolute;
    width: 100%;
    height: 100%;
    // background-color: #7d839e;
    // border-radius: 50%;
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
    // border-radius: 50%;
    display: flex;
    flex-direction: column;
    color: white;
    align-items: center;
    justify-content: space-around;
    .heart {
      width: getRem(39);
      height: getRem(28);
    }
    p {
      font-size: getRem(24);
      // margin: 0 0 0.1rem 0;
      color: #707baa;
    }
  }
  .inactive {
    // background-color:blue;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    // border-radius: 50%;
    display: flex;
    flex-direction: column;
    color: white;
    align-items: center;
    justify-content: space-around;
    .heart {
      width: getRem(39);
      height: getRem(28);
    }
    p {
      font-size: getRem(24);
      // margin: 0 0 0.1rem 0;
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
