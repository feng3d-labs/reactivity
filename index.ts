// import { computed, effect, reactive, ref } from "./src/reactivity";
import { computed, effect, reactive, ref } from "@vue/reactivity";

const a = ref(1);
const b = ref(2);

const ca = computed(() =>
{
    // console.log("computed a");
    return a.value;
})

const cb = computed(() =>
{
    console.log("computed b");
    return b.value;
})

const func = () =>
{
    console.log("computed");
    return ca.value + cb.value;
}
const func1 = () =>
{
    console.log("computed");
    return ca.value + cb.value;
}

const result = computed(func);
const result1 = computed(func1);

console.log(result.value);
console.log(result1.value);

a.value = 2;
a.value = 3;
a.value = 4;
a.value = 1;
console.log(result.value);
console.log(result1.value);

const count = 10000000;

console.time("time");
for (let i = 0; i < count; i++)
{
    result.value;
}
console.timeEnd("time");
console.time("time");
for (let i = 0; i < count; i++)
{
    // a.value = 
    result.value;
    // a.value = 1;
    // a.value = 4;
    // a.value = 1;
    // a.value = 4;
    // result.value;
}
console.timeEnd("time");

// computed
// index.ts:9 computed a
// index.ts:15 computed b
// index.ts:33 3
// index.ts:26 computed
// index.ts:34 3
// index.ts:9 computed a
// index.ts:40 3
// index.ts:41 3