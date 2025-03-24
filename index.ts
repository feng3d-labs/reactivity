import { computed, effect, reactive, ref } from "./reactivity";
// import { computed, effect, reactive, ref } from "@vue/reactivity";

const a = ref(1);
const b = ref(2);

const ca = computed(()=>{
    console.log("computed a");
    return a.value;
})

const cb = computed(()=>{
    console.log("computed b");
    return b.value; 
})

const result = computed(() =>
{
    console.log("computed");
    return ca.value + cb.value;
});

console.log(result.value);

a.value = 2;
a.value = 3;
a.value = 4;
a.value = 1;
console.log(result.value);


// computed
// index.ts:9 computed a
// index.ts:14 computed b
// index.ts:24 3
// index.ts:9 computed a
// index.ts:30 3

// const watchSession: WatchSession = watcher.on()

// result.value;

// effect(() => {
//     result.value;
// })

// result.value;

// // // 修改值
// reactive(a).a = 2;
// reactive(a).a = 2;
// // // result.value;
// reactive(a).a = 3;
// // // result.value;