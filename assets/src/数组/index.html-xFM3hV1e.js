import "../../modulepreload-polyfill-DaKOjhqt.js";
import { p as pkg, c as computed, r as ref, a as computed$1, b as ref$1 } from "../../package-CBGZaZSn.js";
function updateResults(result) {
  let { code, feng3dResult, vueResult } = result;
  code = unescapeUnicode(code);
  const testCodeElement = document.getElementById("test-code");
  testCodeElement.textContent = code;
  document.getElementById("feng3d-time").textContent = feng3dResult.time;
  document.getElementById("feng3d-values").textContent = feng3dResult.values.join(", ");
  document.getElementById("vue-time").textContent = vueResult.time;
  document.getElementById("vue-values").textContent = vueResult.values.join(", ");
}
function unescapeUnicode(escapedStr) {
  const regex = /\\u([0-9a-fA-F]{4})/g;
  return escapedStr.replace(regex, (match, p1) => {
    return String.fromCodePoint(parseInt(p1, 16));
  });
}
function 数组取值(ref2, computed2, count2) {
  const result = { time: void 0, values: [] };
  const arr = new Array(1e4).fill(0).map(() => ref2(0));
  const cb = computed2(() => {
    return arr.reduce((prev, curr) => prev + curr.value, 0);
  });
  const start = performance.now();
  for (let i = 0; i < count2; i++) {
    arr[9999].value++;
    cb.value;
  }
  result.time = performance.now() - start;
  result.values.push(cb.value);
  return result;
}
const count = 1e3;
document.getElementById("feng3d-version").textContent = `@${pkg.dependencies["@feng3d/reactivity"]}`;
document.getElementById("vue-version").textContent = `@${pkg.dependencies["@vue/reactivity"]}`;
updateResults({
  code: `数组取值(ref, computed, ${count});

` + 数组取值.toString(),
  feng3dResult: 数组取值(ref$1, computed$1, count),
  vueResult: 数组取值(ref, computed, count)
});
