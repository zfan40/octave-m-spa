<script>
import * as Swing from "swing";
const { Direction } = Swing;
/**
 *页面信息配置
 * UPDATE: 更新阀值
 * INITPAGE: 分页首页
 * SIZE: 分页一页的数量
 */
const pageConfig = {
  UPDATE: 5,
  INITPAGE: 1,
  SIZE: 10
};
/**
 * mock数据
 */
const testData = (() => {
  const item = {
    id: 166,
    title: "尚未起名",
    cover: "default",
    content: "default",
    url: "//audio.musixise.com/Vwcz7dNc_output.mid",
    favStatus: null,
    createdDate: "2019-03-16 11:33:54",
    userId: 249,
    collectNum: 0,
    lastModifiedDate: "2019-03-16 11:33:54",
    fileHash: "9f2ef529a3e4a1e922f97bf9caac6ca8",
    userVO: null
  };
  const result = [];
  for (let i = 0; i < pageConfig.SIZE; ++i) {
    result.push(item);
  }
  return result;
})();
/**
 * swing 库初始化配置
 */
const config = {
  // 减少左右滑动的距离，体验更好
  throwOutConfidence: (xOffset, yOffset, element) => {
    const xConfidence = Math.min(
      (Math.abs(xOffset) / element.offsetWidth) * 2,
      1
    );
    const yConfidence = Math.min(Math.abs(yOffset) / element.offsetHeight, 1);

    return Math.max(xConfidence, yConfidence);
  },
  allowedDirections: [Direction.LEFT, Direction.RIGHT]
};
/**
 * 首页 component
 * 业务逻辑， 左滑动下一个， 右滑动点赞下一个， 双击点赞，点击中间播放， 点击下面按钮 （编曲页面 | 购买页面）
 *
 */
export default {
  name: "Square",
  data() {
    const { INITPAGE, SIZE } = pageConfig;
    return {
      page: INITPAGE, // 请求页面为第一页
      size: SIZE, // 请求一次20条数据
      // 请求的数据
      stack: []
    };
  },
  created() {
    this.requestData(this.page, this.size);
  },
  computed: {
    isShouldUpdate: function() {
      const { UPDATE } = pageConfig;
      // 剩余UPDATE条就要请求下一个
      return this.stack.length <= UPDATE;
    }
  },
  methods: {
    requestData(page, size) {
      console.log("开始请求呀", page, size);
      // 请求首页数据
      // this.$store.dispatch();
      this.$store
        .dispatch("FETCH_STACKS", {
          page,
          size
        })
        .then(() => {});
      setTimeout(() => {
        this.stack = [...testData, ...this.stack];
      }, 1000);
    },
    createSwingStack() {
      const cards = this.$refs.card.children;
      const stack = Swing.Stack(config);

      Array.prototype.slice.call(cards).forEach(item => {
        stack.createCard(item);
      });
      stack.on("throwout", event => {
        console.log(event);
        console.log("throwout");
        // 卡片拽出为左还是为右
        console.log(
          "Throw direction: " +
            (event.throwDirection == Direction.LEFT ? "left" : "right")
        );
        console.log("毁灭", event);
        // 只要是拽出去了， 就是不在显示了
        // 在throwoutend 的 事件会多次触发， 在这里动画会获取不到dom
        // 待解决
        this.stack.pop();
        if (this.isShouldUpdate) {
          // 如果数量小于，进行新一轮的请求
          this.requestData(++this.page, this.size);
        }
      });
      stack.on("throwin", event => {
        console.log("throwin");
      });
    }
  },
  watch: {
    stack: async function(value) {
      // '监测到数据变动，重新构建swing的stack'
      await this.$nextTick();
      // DOM已经更新完毕， 可以调用swing的 stack
      this.createSwingStack();
    }
  }
};
</script>
<style lang="scss">
@import "../_common/style/_functions.scss";
@import "../_common/style/_variables.scss";
@import "../_common/style/_mixins.scss";
@import "../_common/style/_reboot.scss";

.stack-container {
  width: 100%;
  height: 100%;
  list-style: none;
  position: absolute;
  background: rgb(20, 45, 44);
  li {
    width: getRem(325 * 2);
    height: getRem(530 * 2);
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    box-shadow: 0 2px 2px rgb(20, 45, 44);
    background: rgb(44, 45, 48);
    border-radius: getRem(50);
    margin-top: getRem(50);
    // display: flex;
    // flex-direction: column;
    // justify-content: space-between;
    img {
      width: 100%;
      height: 100%;
      border-radius: getRem(50);
      position: absolute;
      left: 0;
      top: 0;
    }
    .text-content {
      width: 100%;
      position: absolute;
      bottom: 0;
      font-size: 14px;
      background: rgb(44, 45, 48);
      color: rgb(82, 92, 86);
      height: getRem(300);
      border-radius: 0 0 getRem(50) getRem(50);
    }
  }
}

.button_group {
  width: 100%;
  height: getRem(100);
  position: fixed;
  bottom: getRem(30);
  margin: auto;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  button {
    outline: 0;
    border: 0;
    display: block;
    width: getRem(325);
    color: #fff;
    padding: getRem(20);
    font-size: 16px;
    &:first-of-type {
      border-radius: getRem(50) 0 0 getRem(50);
      background: rgb(113, 113, 230);
    }
    &:last-of-type {
      border-radius: 0 getRem(50) getRem(50) 0;
      background: rgb(69, 100, 215);
    }
  }
}
</style>
<template>
  <div>
    <ul class="stack-container" ref="card">
      <li v-for="(i, index) in stack" :key="i.fileHash + index">
        <img :src="'http://pic1.win4000.com/mobile/2019-03-18/5c8f0b339c094.jpg'" alt>
        <div class="text-content">
          <span>{{i.title}}</span>
        </div>
      </li>
    </ul>
    <div class="button_group">
      <button>我来试试</button>
      <button>制作八音盒</button>
    </div>
  </div>
</template>
