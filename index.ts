import { watcher } from "@feng3d/watcher";
import { reactive } from "@vue/reactivity";

const a = { a: { a: 1 } };
const r_a = reactive(a)
// const r_a = new Proxy(a,{})

const o = { a: { a: 1 } };

watcher.watchchain(o, "a", () => { });

console.time("reactive");
for (let i = 0; i < 100000; i++) {
    r_a.a.a;
}
console.timeEnd("reactive")
r_a.a;
console.time("watch");
for (let i = 0; i < 100000; i++) {
    o.a.a;
}
console.timeEnd("watch");
console.time("reactive");
for (let i = 0; i < 100000; i++) {
    r_a.a.a;
}
console.timeEnd("reactive")
r_a.a;
console.time("watch");
for (let i = 0; i < 100000; i++) {
    o.a.a;
}
console.timeEnd("watch");