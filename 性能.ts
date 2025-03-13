import { effect, reactive, toRaw } from "@vue/reactivity";

const num = 100000;
const num1 = 100;

{
    // 性能测试
    const o = {
        a: 1, b: 2, num: 3,
        c: { d: { e: { f: { g: { h: { i: { j: { k: { l: { m: { n: { o: { p: { q: { r: { s: { t: { u: { v: { w: { x: { y: { z: { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 1 } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } } }
    };

    const ro = reactive(o);

    effect(() => {
        // 修改数据
        ro.num = ro.a + ro.b;

        log(o);
    });

    function log(o) {
        for (let i = 0; i < num1; i++) {
            [o.a, o.b, o.num]
        }
    }

    // 修改
    console.time("修改");
    for (let i = 0; i < num; i++) {
        ro.a++;
    }
    console.timeEnd("修改");
}

{
    // 性能测试
    const o = { a: 1, b: 2, num: 3 };
    const ro = reactive(o);
    effect(() => {
        ro.num = ro.a + ro.b;

        log(o);
    });

    function log(o) {
        for (let i = 0; i < num1; i++) {
            [o.a, o.b, o.num]
        }
    }

    // 修改
    console.time("修改");
    for (let i = 0; i < num; i++) {
        ro.a++;
    }
    console.timeEnd("修改");
}

{
    // 性能测试
    const o = { a: 1, b: 2, num: 3 };
    const ro = reactive(o);

    effect(() => {
        ro.num = ro.a + ro.b;

        log();
    });

    function log() {

        for (let i = 0; i < num1; i++) {
            [o.a, o.b, o.num]
        }
    }

    // 修改
    console.time("修改");
    for (let i = 0; i < num; i++) {
        ro.a++;
    }
    console.timeEnd("修改");
}
