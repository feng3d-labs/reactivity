import { Reactivity } from "./reactivity";

/**
 * 创建一个引用，该引用的值可以被响应式系统追踪和更新。
 *
 * @param value 引用的值。
 * @returns 包含 value 属性的对象，用于获取和设置引用的值。
 */
export function ref<T>(value?: T): { value: T }
{
    return new RefReactivity<T>(value);
}

/**
 * 引用反应式节点。
 * 
 * 当使用 ref 函数时，会创建一个 RefReactivity 对象。
 */
class RefReactivity<V> extends Reactivity<V>
{
    get value()
    {
        this.run();

        return this._value;
    }
    set value(v: V)
    {
        if (this._value === v) return;
        this.markDirty();
        this._value = v;
    }

    constructor(value: V)
    {
        super();
        this._value = value;
    }
}

