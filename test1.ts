import { computed, ComputedRef, reactive } from "@vue/reactivity";
import { func } from "./func";

function getA(a: { a: number }) {
    if (!a) return 0;
    const ca = a["_"] ??= computed(() => {
        // 监听
        reactive(a).a;

        return a.a;
    });
    return ca.value;
}

function getB(b: { a: { a: number, }, b: number }) {
    if (!b) return 0;
    const cb = b["_"] ??= computed(() => {
        // 监听
        const rb = reactive(b);
        rb.a;
        rb.b;

        // 计算
        return b.b + getA(b.a);
    });
    return cb.value;
}

function getC(c: { a: { a: number, }, b: { a: { a: number, }, b: number }, c: number }) {
    if (!c) return 0;
    const cc: ComputedRef<number> = c["_"] ??= computed(() => {
        // 监听
        const rc = reactive(c);
        rc.a;
        rc.b;
        rc.c;

        // 计算
        return getA(c.a) + getB(c.b) + c.c;
    });
    return cc.value;
}

export function test1(num: number) {
    const a = { a: 1 };
    const b = { a, b: 2 };
    const c = { a, b, c: 3 };

    console.log(getC(c));
    reactive(c).b = null as any;
    console.log(getC(c));

    reactive(a).a++;
    reactive(a).a--;
    for (let i = 0; i < num; i++) {
        reactive(a).a++;
        reactive(a).a--;
    }
    
    for (let i = 0; i < num; i++) {
        getC(c);
    }
}

