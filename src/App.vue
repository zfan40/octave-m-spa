<template>
<div id="app">
  <transition :name="transitionName">
    <router-view/>
  </transition>
</div>
</template>

<script>
// https://router.vuejs.org/en/advanced/transitions.html
export default {
  name: 'app',
  data() {
    return {
      transitionName:'fade',
    }
  },
  beforeRouteUpdate (to, from, next) {
    // const toPage = to.indexOf('make')
    // const fromPage = from.path.split('/').length
    // this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
    // next()
  },
};
</script>

<style>
.lx-toast {
  rotate: 90deg;
  transform-origin: left;
}
.vue-slider-component .vue-slider-tooltip-wrap.vue-slider-tooltip-left .vue-slider-tooltip:before {
  border:none !important;
}
#app {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height:100%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  user-select: none;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
}
.fade-enter-active {
  transition: all .3s ease-out;
}
.fade-leave-active {
  transition: all .3s ease-out;
}
.fade-enter, .fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
