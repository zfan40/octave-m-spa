<script>
export default {
  props: {
    list: {
      type: Array,
      default(){
        return []
      },
    },
    current: Number,
    to: {
      type: Function,
      default(){
        return function (){
          console.log('change pages!!')
        }
      }
    }
  },
  created(){
    console.log(this.list)
    console.log(this.current)
  }
}
</script>
<template>
  <div class="swiper-container">
    <ul>
      <li v-for="(product, index) in list" :key="product" @click="to(index)" >
        <img :src="product.previewImg||'https://cdn4.buysellads.net/uu/1/3386/1525189887-61450.png'" alt="">
      </li>
    </ul>
  </div>
</template>
<style lang="scss" scoped>
ul  {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 10vh;
  list-style: none;
  display: flex;
  flex-direction: row;
  li{
    flex: 1;
    img{
      width: 10vw;
    }
  }
  .current{
    flex: 1.5;
  }
}
</style>
