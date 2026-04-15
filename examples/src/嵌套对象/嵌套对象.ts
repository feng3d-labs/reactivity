/**
 * 深层嵌套对象读取性能测试
 */
export function 深层嵌套读取(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建 10 层嵌套对象
    let obj: any = { value: 0 };

    for (let i = 0; i < 9; i++)
    {
        obj = { next: obj };
    }
    const reactiveObj = reactive(obj);

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        let current = reactiveObj;

        while (current.next)
        {
            current = current.next;
        }
        result.values.push(current.value);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 深层嵌套对象更新性能测试
 */
export function 深层嵌套更新(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建 10 层嵌套对象
    let obj: any = { value: 0 };

    for (let i = 0; i < 9; i++)
    {
        obj = { next: obj };
    }
    const reactiveObj = reactive(obj);

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 找到最深层并更新
        let current = reactiveObj;

        while (current.next)
        {
            current = current.next;
        }
        current.value = i;
    }

    result.time = performance.now() - start;
    result.values.push(reactiveObj.next.next.value);

    return result;
}

/**
 * 宽对象（大量属性）读取性能测试
 */
export function 宽对象读取(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建包含 1000 个属性的对象
    const obj: any = {};

    for (let i = 0; i < 1000; i++)
    {
        obj[`prop${i}`] = i;
    }
    const reactiveObj = reactive(obj);

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        for (let j = 0; j < 1000; j++)
        {
            result.values.push(reactiveObj[`prop${j}`]);
        }
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 宽对象更新性能测试
 */
export function 宽对象更新(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建包含 1000 个属性的对象
    const obj: any = {};

    for (let i = 0; i < 1000; i++)
    {
        obj[`prop${i}`] = i;
    }
    const reactiveObj = reactive(obj);

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 随机更新一个属性
        const propIndex = i % 1000;

        reactiveObj[`prop${propIndex}`] = i;
    }

    result.time = performance.now() - start;
    result.values.push(reactiveObj.prop0);

    return result;
}

/**
 * 添加删除属性性能测试
 */
export function 添加删除属性(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const obj = reactive({});

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 添加属性
        (obj as any)[`prop${i}`] = i;
        // 删除属性
        if (i > 100)
        {
            delete (obj as any)[`prop${i - 100}`];
        }
    }

    result.time = performance.now() - start;
    result.values.push(Object.keys(obj).length);

    return result;
}

/**
 * 嵌套对象 computed 性能测试
 */
export function 嵌套对象Computed(
    reactive: <T extends object>(target: T) => T,
    computed: <T>(func: (oldValue?: T) => T) => { readonly value: T },
    count: number,
)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建 5 层嵌套对象
    const obj = reactive({
        level1: {
            level2: {
                level3: {
                    level4: {
                        level5: { value: 0 },
                    },
                },
            },
        },
    });

    const computedValue = computed(() => obj.level1.level2.level3.level4.level5.value * 2);

    // 预热
    computedValue.value;

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        obj.level1.level2.level3.level4.level5.value = i;
        result.values.push(computedValue.value);
    }

    result.time = performance.now() - start;

    return result;
}
