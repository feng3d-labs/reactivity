import { computed, ref } from "@feng3d/reactivity";
import { computed as vueComputed, ref as vueRef } from "@vue/reactivity";
import { 复杂场景取值性能 } from "./复杂场景取值性能";

const result = 复杂场景取值性能(ref, computed);
const result1 = 复杂场景取值性能(vueRef, vueComputed);

console.log(unescapeUnicode(复杂场景取值性能.toString()))

console.log(JSON.stringify(result));
console.log(JSON.stringify(result1));


function unescapeUnicode(escapedStr) {
    const regex = /\\u([0-9a-fA-F]{4})/g;
    return escapedStr.replace(regex, (match, p1) => {
        return String.fromCodePoint(parseInt(p1, 16));
    });
}