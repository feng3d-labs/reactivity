/**
 * 基础 ref 操作性能测试
 * 测试基本的 ref 创建、读取、更新操作
 */
export function 基础Ref操作(ref: <T>(value?: T) => { value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建大量 ref
    const refs = new Array(count).fill(0).map(() => ref(0));

    const start = performance.now();

    // 读取和更新操作
    for (let i = 0; i < count; i++)
    {
        refs[i].value++;
    }

    for (let i = 0; i < count; i++)
    {
        result.values.push(refs[i].value);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 基础 computed 性能测试
 * 测试简单 computed 的创建和取值
 */
export function 基础Computed(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const a = ref(1);
    const b = ref(2);
    const c = computed(() => a.value + b.value);

    // 预热
    c.value;

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        a.value = i;
        b.value = i + 1;
        result.values.push(c.value);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 嵌套 computed 性能测试
 * 测试 computed 链式依赖的性能
 */
export function 嵌套Computed(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const a = ref(1);

    // 创建 10 层嵌套 computed
    let current = computed(() => a.value * 2);

    for (let i = 0; i < 9; i++)
    {
        const prev = current;

        current = computed(() => prev.value + 1);
    }

    // 预热
    current.value;

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        a.value = i;
        result.values.push(current.value);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 多依赖 computed 性能测试
 * 测试 computed 依赖多个 ref 的性能
 */
export function 多依赖Computed(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建 100 个 ref
    const refs = new Array(100).fill(0).map(() => ref(1));

    // computed 依赖所有 ref
    const sum = computed(() => refs.reduce((acc, r) => acc + r.value, 0));

    // 预热
    sum.value;

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 每次更新一个 ref
        refs[i % 100].value = i;
        result.values.push(sum.value);
    }

    result.time = performance.now() - start;

    return result;
}
