import { computed, ref } from "@feng3d/reactivity";
// import { computed, effect, reactive, ref } from "@vue/reactivity";

const arr = new Array(100).fill(ref(1));
const b = ref(2);

const ca = computed(() =>
{
    // console.log("computed a");
    // return a.value;

    return arr.reduce((acc, cur) => acc + cur.value, 0);
})

function loop0(depth = 10)
{
    if (depth <= 0) return b.value;
    return loop0(depth - 1) + loop0(depth - 2);
}

function loop(depth = 10)
{
    // console.log("function loop");
    if (depth <= 0) return computed(() =>
    {
        // console.log("b.value");
        return b.value
    }).value;

    return computed(() =>
    {
        // console.log("loop(depth - 1) + 1");
        return loop(depth - 1) + loop(depth - 2);
    }).value;
}

const cb = computed(() =>
{
    // console.log("computed b");
    return loop(10);
});

computed(() =>
{
    // console.log("computed b");
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

console.log(`result`, result.value);
console.log(`result1`, result1.value);

arr[0].value = 2;
arr[0].value = 3;
arr[0].value = 4;
arr[0].value = 1;
console.log(`result`, result.value);
console.log(`result1`, result1.value);

const count = 10000;

console.time("time");
for (let i = 0; i < count; i++)
{
    result.value;
}
console.timeEnd("time");

const update = () =>
{

    b.value++;
    b.value++;
    cb.value;
    console.time("time");

    for (let i = 0; i < count; i++)
    {
        arr[0].value++;
        // b.value--;
        b.value++;
        // a.value = 
        // result.value;
        // arr[0].value = 1;
        // arr[0].value = 4;
        // arr[0].value = 1;
        // arr[0].value = 4;
        // result.value;

        cb.value;
        // loop0(15);
    }
    console.timeEnd("time");
    console.log(cb.value);
    console.log(loop0(18));

    // setTimeout(update, 1000);
    // requestAnimationFrame(update);
}

update();

// computed
// index.ts:9 computed a
// index.ts:15 computed b
// index.ts:33 3
// index.ts:26 computed
// index.ts:34 3
// index.ts:9 computed a
// index.ts:40 3
// index.ts:41 3