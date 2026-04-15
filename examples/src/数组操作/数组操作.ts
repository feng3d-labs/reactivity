/**
 * 大数组读取性能测试
 * 测试从大数组中读取所有元素的性能
 */
export function 大数组读取(ref: <T>(value?: T) => { value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建包含 10000 个 ref 的数组
    const arr = new Array(10000).fill(0).map((_, i) => ref(i));

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        let sum = 0;

        for (let j = 0; j < arr.length; j++)
        {
            sum += arr[j].value;
        }
        result.values.push(sum);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 大数组更新性能测试 - 更新首元素
 */
export function 大数组更新首元素(ref: <T>(value?: T) => { value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const arr = new Array(10000).fill(0).map((_, i) => ref(i));

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        arr[0].value++;
    }

    result.time = performance.now() - start;
    result.values.push(arr[0].value);

    return result;
}

/**
 * 大数组更新性能测试 - 更新尾元素
 */
export function 大数组更新尾元素(ref: <T>(value?: T) => { value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const arr = new Array(10000).fill(0).map((_, i) => ref(i));

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        arr[9999].value++;
    }

    result.time = performance.now() - start;
    result.values.push(arr[9999].value);

    return result;
}

/**
 * 大数组更新性能测试 - 随机更新
 */
export function 大数组随机更新(ref: <T>(value?: T) => { value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const arr = new Array(10000).fill(0).map((_, i) => ref(i));

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        const index = Math.floor(Math.random() * arr.length);

        arr[index].value++;
    }

    result.time = performance.now() - start;
    result.values.push(arr[0].value);

    return result;
}

/**
 * 数组 computed 性能测试
 */
export function 数组Computed(ref: <T>(value?: T) => { value: T }, computed: <T>(func: (oldValue?: T) => T) => { readonly value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const arr = new Array(1000).fill(0).map(() => ref(0));
    const sum = computed(() => arr.reduce((acc, r) => acc + r.value, 0));

    // 预热
    sum.value;

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        arr[i % 1000].value++;
        result.values.push(sum.value);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * 数组添加/删除性能测试
 */
export function 数组增删(ref: <T>(value?: T) => { value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const arr: { value: number }[] = [];

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 添加
        arr.push(ref(i));
        // 删除
        if (arr.length > 100)
        {
            arr.shift();
        }
    }

    result.time = performance.now() - start;
    result.values.push(arr.length);

    return result;
}

/**
 * 嵌套数组性能测试
 */
export function 嵌套数组(ref: <T>(value?: T) => { value: T }, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建 100x100 的二维数组
    const matrix = new Array(100).fill(0).map(() =>
        new Array(100).fill(0).map(() => ref(0)),
    );

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        let sum = 0;

        for (let row = 0; row < 100; row++)
        {
            for (let col = 0; col < 100; col++)
            {
                sum += matrix[row][col].value;
            }
        }
        result.values.push(sum);
    }

    result.time = performance.now() - start;

    return result;
}
