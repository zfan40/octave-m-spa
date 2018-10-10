<script>
// https://codepen.io/jo-asakura/pen/stFHi
export default {
  props: {
    progress: Number,
  },
  computed: {
    style() {},
  },
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
    updateButton() {},
  },
};
</script>

<template>
  <!-- <div class="radial-progress">
    <div class="circle">
      <div class="mask full" :style="{transform:`rotate(${progress*1.8}deg)`}">
        <div class="fill" :style="{transform:`rotate(${progress*1.8}deg)`}"></div>
      </div>
      <div class="mask half">
        <div class="fill" :style="{transform:`rotate(${progress*1.8}deg)`}"></div>
        <div class="fill fix" :style="{transform:`rotate(${progress*3.6}deg)`}"></div>
      </div>      
    </div>
  </div> -->
  <div>
    <div class="pie-wrapper pie-wrapper--solid">
      <div class="before" 
      :style="{
        background:progress<=50?'#25252b':'#979797',
        transform:progress<=50?`rotate(${(100  - progress) / 100 * -360}deg)`:`rotate(${(progress-50) / 100 * 360}deg)`
        }" />
      <!-- <span class="label">{{progress}}<span class="smaller">%</span></span> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../_common/style/_functions.scss";
@import "../../_common/style/_variables.scss";
@import "../../_common/style/_mixins.scss";
@import "../../_common/style/_reboot.scss";
@import "./pieProgress.scss";

$big-circle-size: 34px;
$circle-size: 30px;
$circle-background: #25252b;
$circle-color: #979797;
$transition-length: 0.1s;
.radial-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $big-circle-size;
  height: $big-circle-size;
  background-color: $circle-background;
  border-radius: 50%;
  .circle {
    display: flex;
    align-items: center;
    justify-content: center;
    .mask,
    .fill {
      width: $circle-size;
      height: $circle-size;
      position: absolute;
      border-radius: 50%;
      // transition: -webkit-transform $transition-length;
      // transition: -ms-transform $transition-length;
      // transition: transform $transition-length;
      backface-visibility: hidden;
    }
    .mask {
      clip: rect(0px, $circle-size, $circle-size, $circle-size/2);
      .fill {
        clip: rect(0px, $circle-size/2, $circle-size, 0px);
        background-color: $circle-color;
      }
    }
  }
}
</style>
