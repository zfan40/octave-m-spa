<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="input-section">
      <div class="sector">
        <h3>姓名: </h3>
        <input type="text" v-model="name">
      </div>
      <div class="sector">
        <h3>公司: </h3>
        <input type="text" v-model="company">
      </div>
      <div class="sector">
        <h3>职位: </h3>
        <input type="text" v-model="title">
      </div>
      <div class="sector">
        <h3>电话: </h3>
        <input type="num" v-model="tel">
      </div>
      <div class="sector">
        <h3>背景颜色: </h3>
          <div class="">  </div>
          <div class="">  </div>
          <div class="">  </div>
          <div class="">  </div>
      </div>

    </div>
    <div class="b-card">
      <div class="name">
        {{name}}
      </div>
      <div class="company">
        {{company}}
      </div>
      <div class="title">
        {{title}}
      </div>
      <div class="tel">
        {{tel}}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: '名片制作',
      name:'',
      company:'',
      title:'',
      tel:'',
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
* {margin:0;padding:0}
.hello {
  position: absolute;
  width:100%;
  height:100%;
  .input-section {
    width:10rem;
    background-color:gray;
    position:absolute;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    h3 {font-size:.47rem;}
    .sector {
      display:flex;
      h3 {padding-right:.4rem;}
    }
  }
  .b-card {

  }
}
</style>
