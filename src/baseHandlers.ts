import { track, trigger } from "./dep";
import { reactive, reactiveMap } from "./reactive";
import { isRef } from "./ref";
import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from "./shared/constants";
import { hasChanged, hasOwn, isArray, isIntegerKey, isObject, Target, toRaw } from "./shared/general";

class BaseReactiveHandler implements ProxyHandler<Target>
{
    get(target: Target, key: string | symbol, receiver: object): any
    {
        if (key === ReactiveFlags.IS_REACTIVE)
        {
            return true;
        } else if (key === ReactiveFlags.RAW)
        {
            if (
                receiver ===
                reactiveMap.get(target) ||
                // receiver is not the reactive proxy, but has the same prototype
                // this means the receiver is a user proxy of the reactive proxy
                Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)
            )
            {
                return target
            }
            // early return undefined
            return
        }

        const targetIsArray = isArray(target)

        const res = Reflect.get(
            target,
            key,
            // if this is a proxy wrapping a ref, return methods using the raw ref
            // as receiver so that we don't have to call `toRaw` on the ref in all
            // its class methods
            isRef(target) ? target : receiver,
        )

        //
        track(target, TrackOpTypes.GET, key as any)

        if (isRef(res))
        {
            // ref unwrapping - skip unwrap for Array + integer key.
            return targetIsArray && isIntegerKey(key) ? res : res.value
        }

        if (isObject(res))
        {
            // Convert returned value into a proxy as well. we do the isObject check
            // here to avoid invalid value warning. Also need to lazy access readonly
            // and reactive here to avoid circular dependency.
            return reactive(res)
        }

        return res
    }

    set(
        target: Record<string | symbol, unknown>,
        key: string | symbol,
        value: unknown,
        receiver: object,
    ): boolean
    {
        let oldValue = target[key]

        if (!isArray(target) && isRef(oldValue) && !isRef(value))
        {
            oldValue.value = value
            return true
        }

        const hadKey =
            isArray(target) && isIntegerKey(key)
                ? Number(key) < target.length
                : hasOwn(target, key)
        const result = Reflect.set(
            target,
            key,
            value,
            isRef(target) ? target : receiver,
        )
        // don't trigger if target is something up in the prototype chain of original
        if (target === toRaw(receiver))
        {
            if (!hadKey)
            {
                trigger(target, TriggerOpTypes.ADD, key, value)
            } else if (hasChanged(value, oldValue))
            {
                trigger(target, TriggerOpTypes.SET, key, value, oldValue)
            }
        }
        return result
    }
}

class MutableReactiveHandler extends BaseReactiveHandler
{
    deleteProperty(
        target: Record<string | symbol, unknown>,
        key: string | symbol,
    ): boolean
    {
        const hadKey = hasOwn(target, key)
        const oldValue = target[key]
        const result = Reflect.deleteProperty(target, key)
        if (result && hadKey)
        {
            trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
        }
        return result
    }
}

export const mutableHandlers: ProxyHandler<object> = new MutableReactiveHandler()

