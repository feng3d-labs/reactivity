import { computed, ComputedRef, reactive } from "@vue/reactivity";
import { func } from "./func";

export function test3(num: number) {
    const a = { a: 1 };
    const b = { a, b: 2 };
    const c = { a, b, c: 3 };

    const ca = computed(() => {
        return reactive(a).a;
    });

    const cb = computed(() => {
        return reactive(b).b + ca.value;
    });

    const cc = computed(() => {
        return ca.value + cb.value + reactive(c).c;
    });

    console.log(cc.value);
    reactive(c).b = null as any;
    console.log(cc.value);

    for (let i = 0; i < num; i++) {
        reactive(a).a++;
        reactive(a).a--;
        cc.value;
    }
}

