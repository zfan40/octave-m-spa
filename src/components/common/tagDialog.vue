<script>
export default {
  props: {
    appear: Boolean,
    handleClose: Function
  },
  computed: {
    style() {}
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
    updateButton() {}
  }
};
</script>

<template>
  <transition>
    <div
      style="display:flex;align-items:center;justify-content:center;position:absolute;top:0;width:100%;height:100%;background-color:rgba(0,0,0,.6);z-index:3;"
      v-show="appear"
    >
      <div id="tag-spec">
        <div class="header">标记说明</div>
        <div class="body">该标志表示本作品当前可制作成实体八音盒。能制作成八音盒的乐曲通常具备以下条件
          <ul>
            <li>· 作品音符数量适中</li>
            <li>· 作品音符音高比较分散</li>
          </ul>
        </div>
        <div class="footer" @click="handleClose">关闭</div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@import "../../_common/style/_functions.scss";
@import "../../_common/style/_variables.scss";
@import "../../_common/style/_mixins.scss";
@import "../../_common/style/_reboot.scss";
#tag-spec {
  position: relative;
  width: getRem(670);
  height: getRem(690);
  padding: 0 getRem(56);
  border-radius: getRem(40);
  background-color: #6f7177;
  .header {
    height: getRem(75 * 2);
    text-align: center;
    color: white;
    line-height: getRem(75 * 2);
    font-size: getRem(36);
  }
  .body {
    font-size: getRem(28);
    color: white;
    height: getRem(390);
    overflow-y: scroll;
    text-align: left;
    ul {
      li {
      }
    }
  }

  .footer {
    height: getRem(75 * 2);
    text-align: center;
    color: white;
    line-height: getRem(75 * 2);
    font-size: getRem(32);
  }
}
</style>
