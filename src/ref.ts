import { Dep } from "./dep";
import { ReactiveFlags } from "./shared/constants";

/**
 * 创建一个引用，该引用的值可以被响应式系统追踪和更新。
 *
 * @param value 引用的值。
 * @returns 包含 value 属性的对象，用于获取和设置引用的值。
 */
export function ref<T>(value?: T): { value: T }
{
    if (isRef(value))
    {
        return value as any;
    }

    return new RefReactivity<T>(value);
}

export function isRef<T>(r: { value: T } | unknown): r is { value: T }
export function isRef(r: any): r is { value: any }
{
    return r ? r[ReactiveFlags.IS_REF] === true : false
}

/**
 * 引用反应式节点。
 * 
 * 当使用 ref 函数时，会创建一个 RefReactivity 对象。
 */
class RefReactivity<V> extends Dep<V>
{
    public readonly [ReactiveFlags.IS_REF] = true

    get value()
    {
        this.track();

        return this._value;
    }
    set value(v: V)
    {
        if (this._value === v) return;
        const oldValue = this._value;
        this._value = v;
        this.trigger(v, oldValue);
    }

    constructor(value: V)
    {
        super();
        this._value = value;
    }
}

