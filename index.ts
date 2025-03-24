import { computed, effect, reactive } from "./reactivity";
// import { computed, effect, reactive } from "@vue/reactivity";

const a = { a: 1 };
const b = { b: 2 };
const ra = reactive(a);
const rb = reactive(b);

const result = computed(() => {
    // 监听
    ra.a;
    rb.b;

    // 执行
    console.log("......");
    return 0;
});

// effect(() => {
//     result.value; 
// })

// result.value;

// // 修改值
// reactive(a).a = 2;
// reactive(a).a = 2;
// // result.value;
// reactive(a).a = 3;
// // result.value;