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

## 性能情况
### 使用不同方式维护子节点

// 修改第一个元素 `arr[0].value++;`
| 方式 | 性能(ms) | 速度(x) | 隐患 |
| --- | --- | --- | --- |
| 失效子节点链表 | 126 | 1 | 当节点失效时无法完全清除子节点，并且无法保障检查节点的顺序，导致触发过时的依赖性能或许更差，但一般情况性能最佳。 |
| 全量子节点链表 | 679 | 5.5 | 无 |
| 全量子节点字典 | 1110 | 8.8 | 无 |
| @vue/reactivity | 216 | 1.7 | 无 |

// 修改最后一个元素 `arr[9999].value++`
| 方式 | 性能(ms) | 速度(x) | 隐患 |
| --- | --- | --- | --- |
| 失效子节点链表 | 125 | 1 | 当节点失效时无法完全清除子节点，并且无法保障检查节点的顺序，导致触发过时的依赖性能或许更差，但一般情况性能最佳。 |
| 全量子节点链表 | 730 | 5.5 | 无 |
| 全量子节点字典 | 1210 | 8.8 | 无 |
| @vue/reactivity | 253 | 2.0 | 无 |

```ts
import { computed, ref } from "@feng3d/reactivity";

数组取值(ref, computed, 1000)

export function 数组取值(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T },count: number)
{
    const result = { time: undefined, values: [] };

    const arr:{
        value: number;
    }[] = new Array(10000).fill(0).map(() => ref(0));

    const cb = computed(() =>
    {
        return arr.reduce((prev, curr) => prev + curr.value, 0);
    });

    const start = performance.now();
    for (let i = 0; i < count; i++)
    {
        // arr[0].value++; // 修改第一个元素
        arr[9999].value++; // 修改最后一个元素
        cb.value;
    }
    result.time = performance.now() - start;

    result.values.push(cb.value);

    return result;
}

```

## 为了库的简单易用性不支持以下内容
- markRaw
- shallowRef
- shallowReactive
- shallowReadonly
- readonly
- computed 中 setter
- __v_skip
