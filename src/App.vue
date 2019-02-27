<template>
  <div id="app">
    <transition :name="transitionName">
      <router-view :screenOrientation="screenOrientation"/>
    </transition>
  </div>
</template>

<script>
// https://router.vuejs.org/en/advanced/transitions.html
export default {
  name: "app",
  data() {
    return {
      transitionName: "fade",
      screenOrientation: ""
    };
  },
  created() {
    const win = window;
    const docElem = document.documentElement;
    const on = "addEventListener";
    let timeoutId;

    function delaySetRem() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(setRem, 300);
    }

    function setRem() {
      win.rem = docElem.getBoundingClientRect().width / 10;
      docElem.style.fontSize = win.rem + "px";
    }

    setRem();
    docElem.setAttribute("data-dpr", win.devicePixelRatio);
    win[on]("resize", delaySetRem);
    win[on]("pageshow", function(e) {
      if (e.persisted) {
        delaySetRem();
      }
    });
    //add by ziwen
    if (window.orientation === 180 || window.orientation === 0) {
      // 竖屏状态
      this.screenOrientation = "portrait";
    }
    if (window.orientation === 90 || window.orientation === -90) {
      // 横屏状态
      this.screenOrientation = "landscape";
    }
    win[on]("orientationchange", () => {
      console.log(screen.orientation);
      console.log(window.orientation);
      if (window.orientation === 180 || window.orientation === 0) {
        // 竖屏状态
        this.screenOrientation = "portrait";
      }
      if (window.orientation === 90 || window.orientation === -90) {
        // 横屏状态
        this.screenOrientation = "landscape";
      }
    });

    this.$store.dispatch("FETCH_PRODUCTLIST", {});
  },
  beforeRouteUpdate(to, from, next) {
    // const toPage = to.indexOf('make')
    // const fromPage = from.path.split('/').length
    // this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
    // next()
  }
};
</script>

<style>
* {
  user-select: none;
}
textarea:focus,
input:focus {
  outline: none;
}
.lx-toast {
  rotate: 90deg;
  transform-origin: left;
}
.vue-slider-component
  .vue-slider-tooltip-wrap.vue-slider-tooltip-left
  .vue-slider-tooltip:before {
  border: none !important;
}
#app {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  user-select: none;
  overflow: hidden;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
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
