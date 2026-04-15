/**
 * 批量 ref 更新性能测试
 */
export function 批量Ref更新(
    ref: <T>(value?: T) => { value: T },
    batchRun: ((fn: () => void) => void) | undefined,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建 100 个 ref
    const refs = new Array(100).fill(0).map((_, i) => ref(i));
    let effectRuns = 0;

    // 每个 ref 创建一个 effect 来追踪变化
    refs.forEach((r, i) =>
    {
        // 模拟 effect 追踪
        const value = r.value;

        Object.defineProperty(r, '_effectRuns', {
            get()
            {
                return effectRuns;
            },
            set(v: number)
            {
                effectRuns = v;
            },
        });
    });

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        if (batchRun)
        {
            batchRun(() =>
            {
                // 批量更新所有 ref
                for (let j = 0; j < refs.length; j++)
                {
                    refs[j].value = i + j;
                }
            });
        }
        else
        {
            // 无批处理，直接更新
            for (let j = 0; j < refs.length; j++)
            {
                refs[j].value = i + j;
            }
        }
        effectRuns += refs.length;
    }

    result.time = performance.now() - start;
    result.values.push(effectRuns);

    return result;
}

/**
 * 批量 reactive 对象更新性能测试
 */
export function 批量Reactive更新(
    reactive: <T extends object>(target: T) => T,
    batchRun: ((fn: () => void) => void) | undefined,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建包含 100 个属性的对象
    const obj: any = {};

    for (let i = 0; i < 100; i++)
    {
        obj[`prop${i}`] = i;
    }
    const reactiveObj = reactive(obj);

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        if (batchRun)
        {
            batchRun(() =>
            {
                // 批量更新所有属性
                for (let j = 0; j < 100; j++)
                {
                    reactiveObj[`prop${j}`] = i + j;
                }
            });
        }
        else
        {
            // 无批处理，直接更新
            for (let j = 0; j < 100; j++)
            {
                reactiveObj[`prop${j}`] = i + j;
            }
        }
    }

    result.time = performance.now() - start;
    result.values.push(reactiveObj.prop0);

    return result;
}

/**
 * 批量嵌套对象更新性能测试
 */
export function 批量嵌套更新(
    reactive: <T extends object>(target: T) => T,
    batchRun: ((fn: () => void) => void) | undefined,
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建嵌套对象结构
    const obj = reactive({
        user: {
            profile: {
                name: 'test',
                age: 0,
                email: 'test@example.com',
            },
            settings: {
                theme: 'dark',
                notifications: true,
            },
        },
        data: {
            items: new Array(50).fill(0).map((_, i) => ({ id: i, value: 0 })),
        },
    });

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        if (batchRun)
        {
            batchRun(() =>
            {
                // 批量更新嵌套属性
                obj.user.profile.age = i;
                obj.user.settings.theme = i % 2 === 0 ? 'dark' : 'light';
                obj.data.items.forEach((item: any, idx: number) =>
                {
                    item.value = i + idx;
                });
            });
        }
        else
        {
            // 无批处理，直接更新
            obj.user.profile.age = i;
            obj.user.settings.theme = i % 2 === 0 ? 'dark' : 'light';
            obj.data.items.forEach((item: any, idx: number) =>
            {
                item.value = i + idx;
            });
        }
    }

    result.time = performance.now() - start;
    result.values.push(obj.user.profile.age);

    return result;
}

/**
 * 连续更新 vs 批量更新对比
 */
export function 连续vs批量更新(
    ref: <T>(value?: T) => { value: T },
    batchRun: ((fn: () => void) => void) | undefined,
    count: number,
)
{
    const result = {
        time: { 连续: 0, 批量: 0 },
        values: [],
    };

    const refs = new Array(100).fill(0).map((_, i) => ref(i));

    // 连续更新
    let start = performance.now();

    for (let i = 0; i < count; i++)
    {
        for (let j = 0; j < refs.length; j++)
        {
            refs[j].value = i + j;
        }
    }
    result.time.连续 = performance.now() - start;

    // 批量更新
    start = performance.now();
    for (let i = 0; i < count; i++)
    {
        if (batchRun)
        {
            batchRun(() =>
            {
                for (let j = 0; j < refs.length; j++)
                {
                    refs[j].value = i + j;
                }
            });
        }
        else
        {
            // 无批处理，模拟连续更新
            for (let j = 0; j < refs.length; j++)
            {
                refs[j].value = i + j;
            }
        }
    }
    result.time.批量 = performance.now() - start;

    result.values.push(refs[0].value);

    return result;
}
