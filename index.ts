import { computed, effect, reactive } from "@vue/reactivity";

class A {
    a = 1;
}

function getValue(a: A) {
    const result = computed(() => {
        // 监听
        reactive(a).a;

        // 计算
        return a.a;
    });

    return result.value;
}

const a = new A();

effect(() => {
    console.log(getValue(a));
});