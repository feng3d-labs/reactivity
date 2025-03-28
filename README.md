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

## 性能
### 有损性能的选择
1. 子节点的维护放弃使用链表采用Map，遍历性能略有下降（看不出来），代码可读性提升。
2. 放弃只维护失效子节点而选择保留全量子节点来确保遍历子节点时顺序不变。(检查遍历消耗可能更高，但捕获时可以更好的进行剪枝以及防止过期子节点触发来提升性能)
