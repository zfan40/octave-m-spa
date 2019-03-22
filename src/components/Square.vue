<script>
/**
 * 首页 component
 * 业务逻辑， 左滑动下一个， 右滑动点赞下一个， 双击点赞，点击中间播放， 点击下面按钮 （编曲页面 | 购买页面）
 *
 */
import * as Swing from "swing";
export default {
  name: "Square",
  data() {
    return {
      page: 1, // 请求页面为第一页
      size: 10, // 请求一次10条数据
      // 请求的数据
      stack: []
    };
  },
  created() {
    this.requestData(this.page, this.size);
  },
  computed: {
    isShouldUpdate: function() {
      return stack.length <= 2;
    }
  },
  methods: {
    requestData() {
      const testData = [
        {
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
        },
        {
          id: 165,
          title: "乱名",
          cover: "",
          content: "default",
          url: "//audio.musixise.com/XBrm8UpX_output.mid",
          favStatus: null,
          createdDate: "2019-03-12 22:54:36",
          userId: 239,
          collectNum: 1,
          lastModifiedDate: "2019-03-12 23:08:09",
          fileHash: "3948d78c8c1c6e196c055b0aae320242",
          userVO: null
        },
        {
          id: 164,
          title: "尚未起名",
          cover: "",
          content: "default",
          url: "//audio.musixise.com/GcPxfIwh_output.mid",
          favStatus: null,
          createdDate: "2019-03-12 22:53:48",
          userId: 239,
          collectNum: 0,
          lastModifiedDate: "2019-03-12 22:53:48",
          fileHash: "444625eabf61700c91caedf9f7c9b2ed",
          userVO: null
        },
        {
          id: 163,
          title: "尚未起名",
          cover: "",
          content: "default",
          url: "//audio.musixise.com/bGUub2c1_output.mid",
          favStatus: null,
          createdDate: "2019-03-12 22:51:58",
          userId: 239,
          collectNum: 0,
          lastModifiedDate: "2019-03-12 22:51:58",
          fileHash: "3f342bc3d0f2660be2594c17626fd71b",
          userVO: null
        },
        {
          id: 162,
          title: "roll欢乐颂",
          cover: "",
          content: "速度有点别扭",
          url: "//audio.musixise.com/daVKJiQL_output.mid",
          favStatus: null,
          createdDate: "2019-03-12 22:29:27",
          userId: 239,
          collectNum: 0,
          lastModifiedDate: "2019-03-12 22:30:45",
          fileHash: "bdc68a9dc63a44dbf1ce74169305f146",
          userVO: null
        },
        {
          id: 161,
          title: "阿拉蕾",
          cover: "",
          content: "hahahhaa",
          url: "//audio.musixise.com/RhqrR3T0_output.mid",
          favStatus: null,
          createdDate: "2019-03-12 22:15:44",
          userId: 239,
          collectNum: 0,
          lastModifiedDate: "2019-03-12 22:23:15",
          fileHash: "d863f6469fcdd0331c672d9383ae949e",
          userVO: null
        },
        {
          id: 160,
          title: "bupt-pre",
          cover: "default",
          content: "default",
          url: "//img.musixise.com/be58Jtk6_bupt-prelude.mid",
          favStatus: null,
          createdDate: "2019-03-19 21:42:24",
          userId: 242,
          collectNum: 0,
          lastModifiedDate: "2019-03-19 21:42:24",
          fileHash: "2780626fcc15fc5fa9258ba76976d043",
          userVO: null
        },
        {
          id: 159,
          title: "尚未起名",
          cover: "default",
          content: "default",
          url: "//audio.musixise.com/lXYNXDtK_output.mid",
          favStatus: null,
          createdDate: "2019-03-08 21:56:37",
          userId: 242,
          collectNum: 0,
          lastModifiedDate: "2019-03-08 21:56:37",
          fileHash: "ad9ad5aa6425d6023ea8283e1afd66e9",
          userVO: null
        },
        {
          id: 158,
          title: "尚未起名",
          cover: "default",
          content: "default",
          url: "//img.musixise.com/32VVWR4u_xuemaojiao.mid",
          favStatus: null,
          createdDate: "2019-03-13 14:20:20",
          userId: 242,
          collectNum: 0,
          lastModifiedDate: "2019-03-13 14:20:20",
          fileHash: "ec9f72b9270e55ca8843830a3cd7ed90",
          userVO: null
        },
        {
          id: 157,
          title: "尚未起名",
          cover: "default",
          content: "default",
          url: "//audio.musixise.com/ZadefSIX_output.mid",
          favStatus: null,
          createdDate: "2019-03-08 21:56:33",
          userId: 242,
          collectNum: 0,
          lastModifiedDate: "2019-03-08 21:56:34",
          fileHash: "c7432cd81fba2d229d334246fd622411",
          userVO: null
        }
      ];
      console.log("开始请求呀");
      // 请求首页数据
      // this.$store.dispatch();
      setTimeout(() => {
        this.stack = testData;
      }, 1000);
    },
    createSwingStack() {
      const { Direction } = Swing;
      const config = {
        // 减少左右滑动的距离，体验更好
        throwOutConfidence: (xOffset, yOffset, element) => {
          const xConfidence = Math.min(
            (Math.abs(xOffset) / element.offsetWidth) * 2,
            1
          );
          const yConfidence = Math.min(
            Math.abs(yOffset) / element.offsetHeight,
            1
          );

          return Math.max(xConfidence, yConfidence);
        },
        allowedDirections: [Direction.LEFT, Direction.RIGHT]
      };
      this.$nextTick()
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
        // 只要是拽出去了， 就是不在显示了
        this.stack.pop();
      });
      stack.on("throwin", event => {
        console.log("throwin");
      });
    }
  },
  watch: {
    stack: async function(value) {
      // '监测到数据变动，重新构建swing的stack'
      await this.$nextTick()
      // DOM已经更新完毕， 可以调用swing的 stack
      this.createSwingStack();
    }
  },
  mounted() {
    this.createSwingStack();
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
    width: getRem(335 * 2);
    height: getRem(460 * 2);
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: #0f0;
    border-radius: getRem(50);
    img {
      width: 100%;
      border-radius: getRem(50) getRem(50) 0 0;
    }
  }
}
</style>
<template>
  <div>
    <ul class="stack-container" ref="card">
      <li v-for="i in stack" :key="i.fileHash">
        <img
          :src="i.cover === 'default'  || i.cover ? i.cover : '//img.musixise.com/md1x4ZNE_2.jpeg'"
          alt
        >
      </li>
    </ul>
  </div>
</template>
