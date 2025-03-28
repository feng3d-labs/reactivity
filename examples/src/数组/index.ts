import { computed, ref } from "@feng3d/reactivity";
import { computed as vueComputed, ref as vueRef } from "@vue/reactivity";
import { updateResults } from "./tool";
import { 数组取值 } from "./数组";

vueComputed;
vueRef;

const count = 1000;

// 初始化展示
updateResults({
    code: `数组取值(ref, computed, ${count});\n\n` + 数组取值.toString(),
    feng3dResult: 数组取值(ref, computed, count),
    vueResult: 数组取值(vueRef, vueComputed, count),
});
