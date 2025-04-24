import { mutableHandlers } from './baseHandlers';
import { mutableCollectionHandlers } from './collectionHandlers';
import { Computed } from './computed';
import { Ref } from './ref';
import { ReactiveFlags, TargetType } from './shared/constants';
import { getTargetType, isObject, Target } from './shared/general';

/**
 * 移除对象属性中的 readonly 关键字。
 */
type UnReadonly<T> = {
    -readonly [P in keyof T]: T[P];
};

/**
 * 创建或者获取响应式对象的代理对象。
 *
 * @param target 被响应式的对象。
 * @returns 响应式代理对象。
 *
 * 注意：
 *
 * 1. 扩大被反应式的对象的类型范围，只有`Object.isExtensible`不通过的对象不被响应化。Float32Array等都允许被响应化。
 * 2. 被反应式的对象的只读属性也会被标记为可编辑。希望被反应对象属性一般为只读属性，通过反应式来改变属性值，同时又通过反应式系统来处理其更改后响应逻辑。
 * 
 */
export function reactive<T extends object>(target: T): UnReadonly<Reactive<T>>
{
    if (!isObject(target))
    {
        return target;
    }

    if (target[ReactiveFlags.RAW])
    {
        return target as any;
    }

    // only specific value types can be observed.
    const targetType = getTargetType(target);
    if (targetType === TargetType.INVALID)
    {
        return target as any;
    }

    // target already has corresponding Proxy
    const existingProxy = reactiveMap.get(target);
    if (existingProxy)
    {
        return existingProxy;
    }

    const proxy = new Proxy<T>(
        target,
        targetType === TargetType.COLLECTION ? mutableCollectionHandlers : mutableHandlers as any,
    ) as T;
    reactiveMap.set(target, proxy);

    return proxy as any;
}
export const reactiveMap = new WeakMap<Target, any>();

/**
 * 判断一个对象是否为响应式对象。
 *
 * @param value 对象。
 * @returns
 */
export function isReactive(value: unknown): boolean
{
    return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}

/**
 * 转换为响应式对象。
 *
 * @param value 对象。
 * @returns
 */
export const toReactive = <T>(value: T): T =>
{
    if (isObject(value))
    {
        return reactive(value as any) as any;
    }

    return value;
};

/**
 * 判断一个对象是否为代理对象。
 *
 * @param value 对象。
 * @returns
 */
export function isProxy(value: any): boolean
{
    return value ? !!value[ReactiveFlags.RAW] : false;
}

export type Reactive<T> = UnwrapRefSimple<T>;

/**
 * 原始类型
 */
type Primitive = string | number | boolean | bigint | symbol | undefined | null;
/**
 * 内置类型
 */
export type Builtin = Primitive | Function | Date | Error | RegExp;

/**
 * 用于扩展不被 unwrap 的类型。
 *
 * ``` ts
 * declare module '@vue/reactivity' {
 *   export interface RefUnwrapBailTypes {
 *     runtimeDOMBailTypes: Node | Window
 *   }
 * }
 * ```
 */
export interface RefUnwrapBailTypes { }

/**
 * 解包类型。
 */
export type UnwrapRefSimple<T> =
    T extends
    | Builtin
    | Ref
    | RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
    ? T :
    T extends Ref<infer TT> ? TT :
    T extends Computed<infer TT> ? TT :
    T extends object ? {
        [K in keyof T]: UnwrapRefSimple<T[K]>
    } :
    T;
