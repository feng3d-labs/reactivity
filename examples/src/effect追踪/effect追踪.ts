/**
 * effect 创建和执行性能测试
 */
export function effect创建执行(
    ref: <T>(value?: T) => { value: T },
    effect: <T>(fn: () => T) => any,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        const a = ref(i);
        let captured = 0;

        effect(() =>
        {
            captured = a.value;
        });
        result.values.push(captured);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 多个 effect 追踪同一 ref 性能测试
 */
export function 多effect追踪(
    ref: <T>(value?: T) => { value: T },
    effect: <T>(fn: () => T) => any,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const a = ref(0);

    // 创建 100 个 effect 追踪同一个 ref
    const captures: number[] = new Array(100).fill(0);

    for (let i = 0; i < 100; i++)
    {
        const index = i;

        effect(() =>
        {
            captures[index] = a.value;
        });
    }

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        a.value = i;
        result.values.push(captures[0]);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * effect 追踪多个 ref 性能测试
 */
export function effect追踪多依赖(
    ref: <T>(value?: T) => { value: T },
    effect: <T>(fn: () => T) => any,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建 100 个 ref
    const refs = new Array(100).fill(0).map(() => ref(0));
    let sum = 0;

    // effect 追踪所有 ref
    effect(() =>
    {
        sum = refs.reduce((acc, r) => acc + r.value, 0);
    });

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 每次更新一个 ref
        refs[i % 100].value = i;
        result.values.push(sum);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 嵌套 effect 性能测试
 */
export function 嵌套effect(
    ref: <T>(value?: T) => { value: T },
    effect: <T>(fn: () => T) => any,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const a = ref(0);
    let depth = 0;

    // 创建 5 层嵌套 effect
    function createNestedEffect(n: number)
    {
        if (n === 0)
        {
            effect(() =>
            {
                depth = a.value;
            });
        }
        else
        {
            effect(() =>
            {
                createNestedEffect(n - 1);
            });
        }
    }
    createNestedEffect(5);

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        a.value = i;
        result.values.push(depth);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * effect 嵌套 computed 性能测试
 */
export function effectWithComputed(
    ref: <T>(value?: T) => { value: T },
    computed: <T>(func: (oldValue?: T) => T) => any,
    effect: <T>(fn: () => T) => any,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const a = ref(0);
    const b = ref(0);
    const c = computed(() => a.value + b.value);
    let captured = 0;

    effect(() =>
    {
        captured = c.value;
    });

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        a.value = i;
        b.value = i * 2;
        result.values.push(captured);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * effect stop 和重启性能测试
 */
export function effect停止重启(
    ref: <T>(value?: T) => { value: T },
    effect: <T>(fn: () => T) => any,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const a = ref(0);
    let captured = 0;

    const runner = effect(() =>
    {
        captured = a.value;
    });

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 停止 effect
        if (runner && typeof runner === 'object' && 'stop' in runner)
        {
            (runner as any).stop();
        }
        // 更新值（不会触发 effect）
        a.value = i;

        // 重启 effect
        if (runner && typeof runner === 'object' && 'run' in runner)
        {
            (runner as any).run();
        }
        result.values.push(captured);
    }

    result.time = performance.now() - start;

    return result;
}
