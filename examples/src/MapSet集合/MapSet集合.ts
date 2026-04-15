/**
 * Map 操作性能测试
 */
export function map操作(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建包含 1000 个键值对的 Map
    const map = reactive(new Map<number, number>());

    for (let i = 0; i < 1000; i++)
    {
        map.set(i, i);
    }

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 读取
        for (let j = 0; j < 1000; j++)
        {
            result.values.push(map.get(j));
        }
        // 更新
        map.set(i % 1000, i);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * Map 迭代性能测试
 */
export function map迭代(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const map = reactive(new Map<number, number>());

    for (let i = 0; i < 100; i++)
    {
        map.set(i, i);
    }

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        let sum = 0;

        for (const [key, value] of map)
        {
            sum += key + value;
        }
        result.values.push(sum);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * Map 添加删除性能测试
 */
export function map增删(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const map = reactive(new Map<number, number>());

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        map.set(i, i);
        if (map.size > 100)
        {
            map.delete(i - 100);
        }
    }

    result.time = performance.now() - start;
    result.values.push(map.size);

    return result;
}

/**
 * Set 操作性能测试
 */
export function set操作(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建包含 1000 个元素的 Set
    const set = reactive(new Set<number>());

    for (let i = 0; i < 1000; i++)
    {
        set.add(i);
    }

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        // 检查存在
        for (let j = 0; j < 1000; j++)
        {
            result.values.push(set.has(j) ? 1 : 0);
        }
        // 添加/删除
        set.add(i);
        set.delete(i - 500);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * Set 迭代性能测试
 */
export function set迭代(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const set = reactive(new Set<number>());

    for (let i = 0; i < 100; i++)
    {
        set.add(i);
    }

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        let sum = 0;

        for (const value of set)
        {
            sum += value;
        }
        result.values.push(sum);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * WeakMap 操作性能测试
 */
export function weakmap操作(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    // 创建键对象
    const keys = new Array(100).fill(0).map((_, i) => ({ id: i }));

    const weakMap = reactive(new WeakMap<object, number>());

    for (let i = 0; i < 100; i++)
    {
        weakMap.set(keys[i], i);
    }

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        for (let j = 0; j < 100; j++)
        {
            result.values.push(weakMap.get(keys[j]) ?? 0);
        }
        weakMap.set(keys[i % 100], i);
    }

    result.time = performance.now() - start;

    return result;
}

/**
 * WeakSet 操作性能测试
 */
export function weakset操作(reactive: <T extends object>(target: T) => T, count: number)
{
    const result: { time: number; values: number[] } = { time: 0, values: [] };

    const values = new Array(100).fill(0).map((_, i) => ({ id: i }));

    const weakSet = reactive(new WeakSet<object>());

    for (let i = 0; i < 100; i++)
    {
        weakSet.add(values[i]);
    }

    const start = performance.now();

    for (let i = 0; i < count; i++)
    {
        for (let j = 0; j < 100; j++)
        {
            result.values.push(weakSet.has(values[j]) ? 1 : 0);
        }
    }

    result.time = performance.now() - start;

    return result;
}
