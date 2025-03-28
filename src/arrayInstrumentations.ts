/* eslint-disable prefer-rest-params */

import { endBatch, startBatch } from './batch';
import { pauseTracking, resetTracking } from './dep';
import { PropertyDep } from './property';
import { isProxy, toReactive } from './reactive';
import { ARRAY_ITERATE_KEY, TrackOpTypes } from './shared/constants';
import { isArray, toRaw } from './shared/general';

export const arrayInstrumentations: Record<string | symbol, Function> = <any>{
    __proto__: null,

    /**
     * 返回一个迭代器，用于遍历数组的响应式值
     */
    [Symbol.iterator]()
    {
        return iterator(this, Symbol.iterator, toReactive);
    },

    /**
     * 连接数组并返回新数组，处理响应式数组
     */
    concat(...args: unknown[])
    {
        return reactiveReadArray(this).concat(
            ...args.map((x) => (isArray(x) ? reactiveReadArray(x) : x)),
        );
    },

    /**
     * 返回一个迭代器，用于遍历数组的键值对，并将值转换为响应式
     */
    entries()
    {
        return iterator(this, 'entries', (value: [number, unknown]) =>
        {
            value[1] = toReactive(value[1]);

            return value;
        });
    },

    /**
     * 测试数组中的所有元素是否都通过了指定函数的测试
     */
    every(fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'every', fn, thisArg, undefined, arguments);
    },

    /**
     * 创建一个新数组，包含通过指定函数测试的所有元素
     */
    filter(fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'filter', fn, thisArg, (v) => v.map(toReactive), arguments);
    },

    /**
     * 返回数组中满足指定测试函数的第一个元素
     */
    find(fn: (item: unknown, index: number, array: unknown[]) => boolean,
        thisArg?: unknown,
    )
    {
        return apply(this, 'find', fn, thisArg, toReactive, arguments);
    },

    /**
     * 返回数组中满足指定测试函数的第一个元素的索引
     */
    findIndex(fn: (item: unknown, index: number, array: unknown[]) => boolean,
        thisArg?: unknown,
    )
    {
        return apply(this, 'findIndex', fn, thisArg, undefined, arguments);
    },

    /**
     * 返回数组中满足指定测试函数的最后一个元素
     */
    findLast(fn: (item: unknown, index: number, array: unknown[]) => boolean,
        thisArg?: unknown,
    )
    {
        return apply(this, 'findLast', fn, thisArg, toReactive, arguments);
    },

    /**
     * 返回数组中满足指定测试函数的最后一个元素的索引
     */
    findLastIndex(fn: (item: unknown, index: number, array: unknown[]) => boolean,
        thisArg?: unknown,
    )
    {
        return apply(this, 'findLastIndex', fn, thisArg, undefined, arguments);
    },

    // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement

    /**
     * 对数组中的每个元素执行指定函数
     */
    forEach(fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'forEach', fn, thisArg, undefined, arguments);
    },

    /**
     * 判断数组是否包含指定元素，处理响应式值
     */
    includes(...args: unknown[])
    {
        return searchProxy(this, 'includes', args);
    },

    /**
     * 返回数组中指定元素第一次出现的索引，处理响应式值
     */
    indexOf(...args: unknown[])
    {
        return searchProxy(this, 'indexOf', args);
    },

    /**
     * 将数组的所有元素连接成一个字符串
     */
    join(separator?: string)
    {
        return reactiveReadArray(this).join(separator);
    },

    // keys() iterator only reads `length`, no optimisation required

    /**
     * 返回数组中指定元素最后一次出现的索引，处理响应式值
     */
    lastIndexOf(...args: unknown[])
    {
        return searchProxy(this, 'lastIndexOf', args);
    },

    /**
     * 创建一个新数组，包含对原数组每个元素调用指定函数的结果
     */
    map(fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'map', fn, thisArg, undefined, arguments);
    },

    /**
     * 移除数组的最后一个元素并返回该元素，避免跟踪长度变化
     */
    pop()
    {
        return noTracking(this, 'pop');
    },

    /**
     * 向数组末尾添加一个或多个元素，并返回新的长度，避免跟踪长度变化
     */
    push(...args: unknown[])
    {
        return noTracking(this, 'push', args);
    },

    /**
     * 对数组中的每个元素执行累加器函数，并返回最终结果
     */
    reduce(fn: (
        acc: unknown,
        item: unknown,
        index: number,
        array: unknown[],
    ) => unknown,
        ...args: unknown[]
    )
    {
        return reduce(this, 'reduce', fn, args);
    },

    /**
     * 从右到左对数组中的每个元素执行累加器函数，并返回最终结果
     */
    reduceRight(
        fn: (
            acc: unknown,
            item: unknown,
            index: number,
            array: unknown[],
        ) => unknown,
        ...args: unknown[]
    )
    {
        return reduce(this, 'reduceRight', fn, args);
    },

    /**
     * 移除数组的第一个元素并返回该元素，避免跟踪长度变化
     */
    shift()
    {
        return noTracking(this, 'shift');
    },

    // slice could use ARRAY_ITERATE but also seems to beg for range tracking

    /**
     * 测试数组中的某些元素是否通过了指定函数的测试
     */
    some(
        fn: (item: unknown, index: number, array: unknown[]) => unknown,
        thisArg?: unknown,
    )
    {
        return apply(this, 'some', fn, thisArg, undefined, arguments);
    },

    /**
     * 通过删除或替换现有元素或添加新元素来修改数组，避免跟踪长度变化
     */
    splice(...args: unknown[])
    {
        return noTracking(this, 'splice', args);
    },

    /**
     * 返回一个新数组，包含原数组的反转副本
     */
    toReversed()
    {
        // @ts-expect-error user code may run in es2016+
        return reactiveReadArray(this).toReversed();
    },

    /**
     * 返回一个新数组，包含原数组的排序副本
     */
    toSorted(comparer?: (a: unknown, b: unknown) => number)
    {
        // @ts-expect-error user code may run in es2016+
        return reactiveReadArray(this).toSorted(comparer);
    },

    /**
     * 返回一个新数组，包含原数组的切片副本
     */
    toSpliced(...args: unknown[])
    {
        // @ts-expect-error user code may run in es2016+
        return (reactiveReadArray(this).toSpliced as any)(...args);
    },

    /**
     * 向数组开头添加一个或多个元素，并返回新的长度，避免跟踪长度变化
     */
    unshift(...args: unknown[])
    {
        return noTracking(this, 'unshift', args);
    },

    /**
     * 返回一个迭代器，用于遍历数组的响应式值
     */
    values()
    {
        return iterator(this, 'values', toReactive);
    },
};

// instrument iterators to take ARRAY_ITERATE dependency
function iterator(
    self: unknown[],
    method: keyof Array<unknown>,
    wrapValue: (value: any) => unknown,
)
{
    // note that taking ARRAY_ITERATE dependency here is not strictly equivalent
    // to calling iterate on the proxified array.
    // creating the iterator does not access any array property:
    // it is only when .next() is called that length and indexes are accessed.
    // pushed to the extreme, an iterator could be created in one effect scope,
    // partially iterated in another, then iterated more in yet another.
    // given that JS iterator can only be read once, this doesn't seem like
    // a plausible use-case, so this tracking simplification seems ok.
    const arr = shallowReadArray(self);
    const iter = (arr[method] as any)() as IterableIterator<unknown> & {
        _next: IterableIterator<unknown>['next']
    };
    if (arr !== self)
    {
        iter._next = iter.next;
        iter.next = () =>
        {
            const result = iter._next();
            if (result.value)
            {
                result.value = wrapValue(result.value);
            }

            return result;
        };
    }

    return iter;
}

/**
 * 跟踪数组的迭代操作并返回原始数组
 */
function shallowReadArray<T>(arr: T[]): T[]
{
    PropertyDep.track((arr = toRaw(arr)), TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY);

    return arr;
}

function reactiveReadArray<T>(array: T[]): T[]
{
    const raw = toRaw(array);
    if (raw === array) return raw;
    PropertyDep.track(raw, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY);

    return raw.map(toReactive);
}

// in the codebase we enforce es2016, but user code may run in environments
// higher than that
type ArrayMethods = keyof Array<any> | 'findLast' | 'findLastIndex';

// instrument functions that read (potentially) all items
// to take ARRAY_ITERATE dependency
function apply(
    self: unknown[],
    method: ArrayMethods,
    fn: (item: unknown, index: number, array: unknown[]) => unknown,
    thisArg?: unknown,
    wrappedRetFn?: (result: any) => unknown,
    args?: IArguments,
)
{
    const arr = shallowReadArray(self);
    const needsWrap = arr !== self;
    const methodFn = arr[method];

    // #11759
    // If the method being called is from a user-extended Array, the arguments will be unknown
    // (unknown order and unknown parameter types). In this case, we skip the shallowReadArray
    // handling and directly call apply with self.
    if (methodFn !== Array.prototype[method as any])
    {
        const result = methodFn.apply(self, args);

        return needsWrap ? toReactive(result) : result;
    }

    let wrappedFn = fn;
    if (arr !== self)
    {
        if (needsWrap)
        {
            wrappedFn = function (this: unknown, item, index)
            {
                return fn.call(this, toReactive(item), index, self);
            };
        }
        else if (fn.length > 2)
        {
            wrappedFn = function (this: unknown, item, index)
            {
                return fn.call(this, item, index, self);
            };
        }
    }
    const result = methodFn.call(arr, wrappedFn, thisArg);

    return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}

// instrument reduce and reduceRight to take ARRAY_ITERATE dependency
function reduce(
    self: unknown[],
    method: keyof Array<any>,
    fn: (acc: unknown, item: unknown, index: number, array: unknown[]) => unknown,
    args: unknown[],
)
{
    const arr = shallowReadArray(self);
    let wrappedFn = fn;
    if (arr !== self)
    {
        wrappedFn = function (this: unknown, acc, item, index)
        {
            return fn.call(this, acc, toReactive(item), index, self);
        };
    }

    return (arr[method] as any)(wrappedFn, ...args);
}

// instrument identity-sensitive methods to account for reactive proxies
function searchProxy(
    self: unknown[],
    method: keyof Array<any>,
    args: unknown[],
)
{
    const arr = toRaw(self) as any;
    PropertyDep.track(arr, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY);
    // we run the method using the original args first (which may be reactive)
    const res = arr[method](...args);

    // if that didn't work, run it again using raw values.
    if ((res === -1 || res === false) && isProxy(args[0]))
    {
        args[0] = toRaw(args[0]);

        return arr[method](...args);
    }

    return res;
}

// instrument length-altering mutation methods to avoid length being tracked
// which leads to infinite loops in some cases (#2137)
function noTracking(
    self: unknown[],
    method: keyof Array<any>,
    args: unknown[] = [],
)
{
    startBatch();
    pauseTracking();
    const res = (toRaw(self) as any)[method].apply(self, args);
    resetTracking();
    endBatch();

    return res;
}
