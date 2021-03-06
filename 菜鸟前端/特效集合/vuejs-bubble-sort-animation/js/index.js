const EVENT_DELAY = 200; // 交换的过渡时间
const HEIGHT_INCREMENT = 20; //高度的增量, 数组的某一个值 * 增量 = 长方形高度
const SORT_ARRAY = [16,11,4,5,3,7,10,8,9,2,1];  // 进行冒泡排序的数组
 

const store = new Vuex.Store({
  state: {
    values: [], // 值为 SORT_ARRAY 的副本
    cards: [], // 可视化需要的数组，就是每一个长方形（div元素），数组的每一个值都代表一个div元素
    done: true, // 表示是否排序完成，为true时，右下角出现重置按钮

	// strValues 用来解决数组中出现重复的值，移动位置不对的情况
	strValues:[], // 数组的一个副本，会将数组的值与下标拼起来，形成唯一的一个字符串
  },
  
  mutations: {
    // 重置，重新开始排序
    reset (state, payload) {
      state.values = payload.values;
	  // 遍历state.values，把state.values的每个值和下标拼接，形成唯一的字符串
	  // 值 和 下标 中间加上一个 符号，确保是唯一的，注意符号不能用""空字符串
	  state.values.forEach((item,i)=>state.strValues.push(item+'&'+i));

	  // 往 state.cards 中，添加对象，每个对象都代表一个需要排序的长方形（div元素）
      state.cards = [];
      for (let i = 0; i < state.values.length; i++) {
        state.cards.push({
          value:state.values[i], // 数组中的值
		  strValue:state.strValues[i], //数组中的值和下标拼接的字符串
          sortIndex:i, // 排序的索引
          isActive: false, // 是否激活
          isLocked: false  // 是否锁定
        });
      }
      
      state.done = false;
    },
    
	// 交换
    swap (state, payload) {
      let a = payload.indexes[0]; 
      let b = payload.indexes[1]; 
      let temp = state.values[a];

	  // 交换真实的值
      state.values[a] = state.values[b];
      state.values[b] = temp;

	  // 交换 数组中的值和下标拼接的字符串
	  let temp2 = state.strValues[a];
      state.strValues[a] = state.strValues[b];
      state.strValues[b] = temp2;

      // 重新定义state.cards的每个成员的sortIndex属性
      state.cards.forEach((card) => {
			card.sortIndex =state.strValues.indexOf(card.strValue);
      });
    },
    
	// 激活 
	// 用参数 payload的indexes属性中所有成员，与state.cards 的每个成员（card）的sortIndex属性与进行匹配，
	// 如果找到相等的，就将state.cards 的成员（card）的isActive设置为true
    activate (state, payload) {
      payload.indexes.forEach((index) => {
			state.cards.forEach((card) => {
				if(card.sortIndex === index) card.isActive = true;
			});
      });
    },

	//  释放 
	// 用参数 payload的indexes属性中所有成员，与state.cards 的每个成员（card）的sortIndex属性与进行匹配，
	// 如果找到相等的，就将state.cards 的成员（card）的isActive设置为false
    deactivate (state, payload) {
      payload.indexes.forEach((index) => {
			state.cards.forEach((card) => {
				if(card.sortIndex === index) card.isActive = false;
			});
      });
    },

	// 锁定 
	// 用参数 payload的indexes属性中所有成员，与state.cards 的每个成员（card）的sortIndex属性与进行匹配，
	// 如果找到相等的，就将state.cards 的成员（card）的isLocked设置为true
    lock (state, payload) {
      payload.indexes.forEach((index) => {
			state.cards.forEach((card) => {
				if(card.sortIndex === index) card.isLocked = true;
			});
      });
    },
    
	// 完成
    done (state) {
      state.done = true;
    }
  }
});

Vue.component('sort-card', {
  template: '#sort-card-template',
  props: ['value', 'sortIndex', 'isActive', 'isLocked'],
  computed: {
    cardClassObject() {
      return {
        'card-active': this.isActive,
        'card-locked': this.isLocked
      }
    }
  }
});

new Vue({
  el: '#app',
  store, 
  created(){
    this.reset(SORT_ARRAY);
  },
  methods: {
	// 重置
    reset(arr) {
	  // 获取传入数组的一个副本，因为重置功能需要不改变原数组
	  let values = arr.slice();
      store.commit({ type: 'reset', values: values });

	  // 排序数组，返回一个包括每步的值 和 每步状态的数组
      let sequence = this.bubbleSort(values);

	  // 遍历上边排序得到的数组，定时执行操作，实现动画效果
      sequence.forEach((event, index) => {
        setTimeout(() => { store.commit(event); }, index * EVENT_DELAY);
      });
    },
    
	// 冒泡排序方法，返回包括每一步的数组
    bubbleSort(values) {
	  // sequence 为包括每一步内容的数组
      let sequence = [];
	  // swapped 为判断是否已经排序好的 标志位
      let swapped;
	  // indexLastUnsorted 用来减少不必要的循环
      let indexLastUnsorted = values.length - 1;

      do {
        swapped = false;
        for (let i = 0; i < indexLastUnsorted; i++) {
		  // card 是 state.cards 的一个成员
		  // 开始一次循环，就有两个card 的 isActive的值设置为true
          sequence.push({ type: 'activate', indexes: [i, i + 1] });

		  // 如果前一个数 大于 后一个数，就交换两数
          if (values[i] > values[i + 1]) {
            let temp = values[i];
            values[i] = values[i + 1];
            values[i + 1] = temp;
            swapped = true;
			// 满足交换的条件，就重新定义所有card的sortIndex属性
            sequence.push({ type: 'swap', indexes: [i, i + 1] });
          }
		   // 结束这次循环之前，把原来两个card的isActive的值为true的，设置为false
          sequence.push({ type: 'deactivate', indexes: [i, i + 1] });
        }
		// 外层循环，每循环完一次，就锁定最后一个card，下次这个card 就不参与循环
        sequence.push({ type: 'lock', indexes: [indexLastUnsorted] });
        indexLastUnsorted--;
      } while (swapped);
      
	  // 如果提前排序好了，把剩下的card全部锁定
      let skipped = Array.from(Array(indexLastUnsorted + 1).keys());
      sequence.push({ type: 'lock', indexes: skipped });
	  // 修改done 为true，完成排序
      sequence.push({ type: 'done' });
	  console.log('包括每一步内容的数组',sequence);
      return sequence;
    }
  }
});