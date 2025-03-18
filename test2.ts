import { computed, ComputedRef, reactive } from "@vue/reactivity";

const a = { a: 1 };
const b = { a, b: 2 };
const c = { a, b, c: 3 };

function getA(a: { a: number }) {

    const ca = a["_"] ??= computed(() => {
        console.log("ca");
        return reactive(a).a;
    });

    return ca.value;
}

function getB(b: { a: { a: number, }, b: number }) {
    const cb = b["_"] ??= computed(() => {

        console.log("cb");
        return reactive(b).b + getA(b.a);

    });
    return cb.value;
}

function getC(c: { a: { a: number, }, b: { a: { a: number, }, b: number }, c: number }) {
    let cc: ComputedRef<number> = c["_"];
    if (cc) return cc.value;

    console.log("getC");

    cc = computed(() => {
        console.log("cc");
        return getA(c.a) + getB(c.b) + reactive(c).c;
    });
    c["_"] = cc;

    return cc.value;
}

export function test2(num: number) {
    for (let i = 0; i < num; i++) {
        reactive(a).a++;
        getC(c);
    }
}

