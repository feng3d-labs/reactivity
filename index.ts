import { test1 } from "./test1";
import { test2 } from "./test2";

const num = 100000;

console.time("test1");
test1(num);
console.timeEnd("test1");
console.log("-------------");
console.time("test2");
test2(num);
console.timeEnd("test2");
// console.log("-------------");
// console.time("test1");
// test1(num);
// console.timeEnd("test1");
// console.log("-------------");
// console.time("test2");
// test2(num);
// console.timeEnd("test2");
