import { mutableHandlers } from "./baseHandlers"
import { ReactiveFlags, TargetType } from "./shared/constants"
import { getTargetType, isObject, Target } from "./shared/general"

export function reactive<T extends object>(target: T): T
{
    if (!isObject(target))
    {
        return target
    }

    // only specific value types can be observed.
    const targetType = getTargetType(target)
    if (targetType === TargetType.INVALID)
    {
        return target
    }

    // target already has corresponding Proxy
    const existingProxy = reactiveMap.get(target)
    if (existingProxy)
    {
        return existingProxy
    }

    // const proxy = new Proxy<T>(
    //     target,
    //     targetType === TargetType.COLLECTION ? mutableCollectionHandlers : mutableHandlers,
    // ) as T;
    const proxy = new Proxy<T>(
        target,
        mutableHandlers,
    ) as T;
    reactiveMap.set(target, proxy)

    return proxy
}
export const reactiveMap = new WeakMap<Target, any>();

export function isReactive(value: unknown): boolean
{
    return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}