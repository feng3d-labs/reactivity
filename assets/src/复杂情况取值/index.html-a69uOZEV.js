import "../../modulepreload-polyfill-DaKOjhqt.js";
import { p as pkg, c as computed, r as ref, a as computed$1, b as ref$1 } from "../../package-9zMEdmDL.js";
function updateResults(result) {
  let { code, feng3dResult, vueResult, 结论 } = result;
  code = unescapeUnicode(code);
  const testCodeElement = document.getElementById("test-code");
  testCodeElement.textContent = code;
  document.getElementById("feng3d-time").textContent = feng3dResult.time;
  document.getElementById("feng3d-values").textContent = feng3dResult.values.join(", ");
  document.getElementById("vue-time").textContent = vueResult.time;
  document.getElementById("vue-values").textContent = vueResult.values.join(", ");
  document.getElementById("feng3d-分析").textContent = (结论 == null ? void 0 : 结论.feng3d) ?? "未提供";
  document.getElementById("vue-分析").textContent = (结论 == null ? void 0 : 结论.vue) ?? "未提供";
}
function unescapeUnicode(escapedStr) {
  const regex = /\\u([0-9a-fA-F]{4})/g;
  return escapedStr.replace(regex, (match, p1) => {
    return String.fromCodePoint(parseInt(p1, 16));
  });
}
function 复杂情况取值(ref2, computed2, count2) {
  const result = { time: void 0, values: [] };
  const b = ref2(2);
  function 递归(depth = 10) {
    if (depth <= 0) return computed2(() => {
      return b.value;
    }).value;
    return computed2(() => {
      return 递归(depth - 1) + 递归(depth - 2);
    }).value;
  }
  const cb = computed2(() => {
    return 递归(16);
  });
  b.value++;
  cb.value;
  const start = performance.now();
  for (let i = 0; i < count2; i++) {
    ref2(1).value++;
    cb.value;
  }
  result.time = performance.now() - start;
  result.values.push(cb.value);
  return result;
}
const count = 1e4;
document.getElementById("feng3d-version").textContent = `@${pkg.dependencies["@feng3d/reactivity"]}`;
document.getElementById("vue-version").textContent = `@${pkg.dependencies["@vue/reactivity"]}`;
updateResults({
  code: `复杂情况取值(ref, computed, ${count});

` + 复杂情况取值.toString(),
  feng3dResult: 复杂情况取值(ref$1, computed$1, count),
  vueResult: 复杂情况取值(ref, computed, count),
  结论: {
    vue: `@vue/reactivity 自上而下的使用版本号进行维护状态，当全局有变化时（ref(1).value++ 标记变化）每次取值时都会遍历整个树的子节点比对版本号判断是否需要重新计算。`,
    feng3d: `@feng3d/reactivity 自下而上的使用脏标记进行维护状态，当发生变化时只会冒泡一次到父节点，全局有变化时（ref(1).value++ 标记变化）并不会触发重新计算。`
  }
});
