import { computed, effect, reactive, ref, toRaw, unref, watch } from "@vue/reactivity";

const arr: { funcs?: (() => void)[] } = reactive({});

const r = computed(() => {
    arr.funcs?.forEach(func => func());
});

function getValue() {
    r.value;
}

effect(() => {
    getValue();

    console.log(`,,,,,,,,,,,,,,,,,`);
})

arr.funcs = [() => { console.log(1) }, () => { console.log(2) }];
arr.funcs.push(() => { console.log(3) });

// console.log(toRaw(arr) === unref(arr));
// console.log(arr === ref(arr));

// watch(arr, (newValue, oldValue) => {
//     console.log(newValue, oldValue);
// });

// arr.push(4);
// arr.pop();
arr[0] = 5;
// arr[10] = 1;

// arr.a.aa = 2;
// arr.a.aa = 3;
// arr.a.aa = 4;

// arr[0] = { a: 1 } as any;
// arr[0].a = 2;
// arr[0] = { a: 2 } as any;
// arr[0] = { a: 2 } as any;
// arr[0] = { a: 2 } as any;

// console.time();
// for (let i = 0; i < 10000000; i++) {
//     arr.forEach(() => {});
// }
// console.timeEnd();
// console.time();
// for (let i = 0; i < 1000000; i++) {
//     Object.keys(arr);
// }
// console.timeEnd();