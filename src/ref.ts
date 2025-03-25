import { Reactivity } from "./Reactivity";
import { ReactiveFlags } from "./shared/general";

/**
 * 创建一个引用，该引用的值可以被响应式系统追踪和更新。
 *
 * @param value 引用的值。
 * @returns 包含 value 属性的对象，用于获取和设置引用的值。
 */
export function ref<T>(value?: T): Ref<T>
{
    if (isRef(value))
    {
        return value as any;
    }

    return new RefReactivity<T>(value);
}

export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>
export function isRef(r: any): r is Ref
{
    return r ? r[ReactiveFlags.IS_REF] === true : false
}

export interface Ref<T = any, S = T>
{
    get value(): T
    set value(_: S)
}

/**
 * 引用反应式节点。
 * 
 * 当使用 ref 函数时，会创建一个 RefReactivity 对象。
 */
class RefReactivity<V> extends Reactivity<V>
{
    public readonly [ReactiveFlags.IS_REF] = true

    get value()
    {
        this.run();

        return this._value;
    }
    set value(v: V)
    {
        if (this._value === v) return;
        const oldValue = this._value;
        this._value = v;
        this.markDirty(v, oldValue);
    }

    constructor(value: V)
    {
        super();
        this._value = value;
    }
}

