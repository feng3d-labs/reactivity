import { arrayInstrumentations } from "./arrayInstrumentations";
import { ITERATE_KEY } from "./dep";
import { reactive, reactiveMap } from "./reactive";
import { isRef } from "./ref";
import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from "./shared/constants";
import { hasChanged, hasOwn, isArray, isIntegerKey, isObject, isSymbol, makeMap, Target, toRaw } from "./shared/general";
import { track, trigger } from "./track";

/**
 * 基础响应式处理器。
 */
class BaseReactiveHandler implements ProxyHandler<Target>
{
    /**
     * 获取对象的属性值。
     * 
     * @param target 对象本身 
     * @param key 属性名
     * @param receiver 代理对象
     * @returns 
     */
    get(target: Target, key: string | symbol, receiver: object): any
    {
        // 
        if (key === ReactiveFlags.IS_REACTIVE) // 判断是否为响应式对象
        {
            return true;
        }
        else if (key === ReactiveFlags.RAW) // 获取原始对象
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

        let fn: Function | undefined
        if (targetIsArray && (fn = arrayInstrumentations[key]))
        {
            return fn
        }
        if (key === 'hasOwnProperty')
        {
            return hasOwnProperty
        }

        const res = Reflect.get(
            target,
            key,
            isRef(target) ? target : receiver,
        )

        if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key))
        {
            return res
        }

        //
        track(target, TrackOpTypes.GET, key as any)

        // 如果是 ref，则返回 ref.value
        if (isRef(res))
        {
            return targetIsArray && isIntegerKey(key) ? res : res.value
        }

        // 如果是对象，则递归响应式化
        if (isObject(res))
        {
            return reactive(res)
        }

        return res
    }

}

/**
 * 可变响应式处理器。
 */
class MutableReactiveHandler extends BaseReactiveHandler
{
    /**
     * 设置对象的属性值。
     * @param target 被代理的对象。 
     * @param key 属性名。
     * @param value 新值。 
     * @param receiver 代理对象。
     * @returns 设置是否成功。
     */
    set(
        target: Record<string | symbol, unknown>,
        key: string | symbol,
        value: unknown,
        receiver: object,
    ): boolean
    {
        let oldValue = target[key]

        oldValue = toRaw(oldValue)
        value = toRaw(value)

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
        //
        __DEV__ && console.assert(target === toRaw(receiver));

        // 如果目标在原始原型链中，则不要触发
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

    /**
     * 删除对象的属性。
     * 
     * @param target 被代理的对象。
     * @param key 属性名。
     * @returns 删除是否成功。
     */
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

    has(target: Record<string | symbol, unknown>, key: string | symbol): boolean
    {
        const result = Reflect.has(target, key)
        if (!isSymbol(key) || !builtInSymbols.has(key))
        {
            track(target, TrackOpTypes.HAS, key)
        }
        return result
    }

    ownKeys(target: Record<string | symbol, unknown>): (string | symbol)[]
    {
        track(
            target,
            TrackOpTypes.ITERATE,
            isArray(target) ? 'length' : ITERATE_KEY,
        )
        return Reflect.ownKeys(target)
    }
}

/**
 * 可变响应式处理器。
 */
export const mutableHandlers: ProxyHandler<object> = new MutableReactiveHandler()


function hasOwnProperty(this: object, key: unknown)
{
    // #10455 hasOwnProperty may be called with non-string values
    if (!isSymbol(key)) key = String(key)
    const obj = toRaw(this)
    track(obj, TrackOpTypes.HAS, key)
    return obj.hasOwnProperty(key as string)
}

const builtInSymbols = new Set(
    /*@__PURE__*/
    Object.getOwnPropertyNames(Symbol)
        // ios10.x Object.getOwnPropertyNames(Symbol) can enumerate 'arguments' and 'caller'
        // but accessing them on Symbol leads to TypeError because Symbol is a strict mode
        // function
        .filter(key => key !== 'arguments' && key !== 'caller')
        .map(key => Symbol[key as keyof SymbolConstructor])
        .filter(isSymbol),
)

const isNonTrackableKeys = /*@__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`)