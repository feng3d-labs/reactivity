import { mutableHandlers } from "./baseHandlers"
import { mutableCollectionHandlers } from "./collectionHandlers"
import { Computed } from "./computed"
import { Ref } from "./ref"
import { ReactiveFlags, TargetType } from "./shared/constants"
import { getTargetType, isObject, Target } from "./shared/general"

export function reactive<T extends object>(target: T): Reactive<T>
{
    if (!isObject(target))
    {
        return target
    }

    if (target[ReactiveFlags.RAW])
    {
        return target as any
    }

    // only specific value types can be observed.
    const targetType = getTargetType(target)
    if (targetType === TargetType.INVALID)
    {
        return target as any
    }

    // target already has corresponding Proxy
    const existingProxy = reactiveMap.get(target)
    if (existingProxy)
    {
        return existingProxy
    }

    const proxy = new Proxy<T>(
        target,
        targetType === TargetType.COLLECTION ? mutableCollectionHandlers : mutableHandlers as any,
    ) as T;
    reactiveMap.set(target, proxy)

    return proxy as any
}
export const reactiveMap = new WeakMap<Target, any>();

export function isReactive(value: unknown): boolean
{
    return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}

export const toReactive = <T extends unknown>(value: T): T =>
{
    if (isObject(value))
    {
        return reactive(value as any) as any;
    }
    return value;
}

export function isProxy(value: any): boolean
{
    return value ? !!value[ReactiveFlags.RAW] : false
}

export type Reactive<T> = UnwrapRefSimple<T>

type Primitive = string | number | boolean | bigint | symbol | undefined | null
export type Builtin = Primitive | Function | Date | Error | RegExp

/**
 * This is a special exported interface for other packages to declare
 * additional types that should bail out for ref unwrapping. For example
 * \@vue/runtime-dom can declare it like so in its d.ts:
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

export type UnwrapRefSimple<T> =
    T extends
    | Builtin
    | Ref
    | RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
    ? T :
    T extends Computed<infer TT> ? TT :
    T extends Ref<infer TT> ? TT :
    T extends object ? {
        [K in keyof T]: UnwrapRefSimple<T[K]>
    } :
    T
