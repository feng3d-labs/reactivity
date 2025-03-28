# @feng3d/reactivity

feng3d的响应式库。

源码：https://gitee.com/feng3d/reactivity

文档：https://feng3d.com/reactivity

## 网站

https://feng3d.com/reactivity

## 安装
```
npm install @feng3d/reactivity
```

## 示例

### 监听对象属性的变化
```
import { computed, ref } from "@feng3d/reactivity";

const result = { time: undefined, values: [] };

const b = ref(2);

function 递归(depth = 10)
{
    if (depth <= 0) return computed(() =>
    {
        return b.value
    }).value;

    return computed(() =>
    {
        return 递归(depth - 1) + 递归(depth - 2);
    }).value;
}

const cb = computed(() =>
{
    return 递归(16);
});

const count = 10000;

b.value++;
cb.value;

const start = performance.now();
for (let i = 0; i < count; i++)
{
    ref(1).value++; // 添加此行代码将会导致 @vue/reactivity 版本的性能下降，而 @feng3d/reactivity 版本的性能保持不变

    cb.value;
}
result.time = performance.now() - start;

result.values.push(cb.value);
```
