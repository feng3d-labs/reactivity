import { anyEmitter } from "@feng3d/event";
import { watcher } from "@feng3d/watcher";

const a = { a: 1 };

watcher.watch(a, "a", (newValue, oldValue) => {
    // console.log("a.a change", newValue, oldValue);
});

anyEmitter.on(a, "changed", () => {
    // console.log("a.a change");
})

const count = 1000000;

console.time("watcher");
for (let i = 0; i < count; i++) {
    a.a = i;
}
console.timeEnd("watcher");

console.time("anyEmitter");
for (let i = 0; i < count; i++) {
    anyEmitter.emit(a, "changed");
}
console.timeEnd("anyEmitter");
console.time("watcher");
for (let i = 0; i < count; i++) {
    a.a = i;
}
console.timeEnd("watcher");

console.time("anyEmitter");
for (let i = 0; i < count; i++) {
    anyEmitter.emit(a, "changed");
}
console.timeEnd("anyEmitter");