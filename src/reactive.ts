import { mutableHandlers } from './baseHandlers';
import { mutableCollectionHandlers } from './collectionHandlers';
import { Computed } from './computed';
import { Ref } from './ref';
import { ReactiveFlags, TargetType } from './shared/constants';
import { getTargetType, isObject, Target } from './shared/general';

/**
 *
 * @param target
 * @returns
 */
export function reactive<T extends object>(target: T): Reactive<T>
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

export function isReactive(value: unknown): boolean
{
    return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}

export const toReactive = <T>(value: T): T =>
{
    if (isObject(value))
    {
        return reactive(value as any) as any;
    }

    return value;
};

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
