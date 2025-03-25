import { Reactivity } from "./reactivity";

/**
 * 创建响应式值的引用。
 *
 * @param value
 * @returns
 */
export function ref<T>(value: T): { value: T }
{
    return new RefReactivity<T>(value);
}

/**
 * 属性值反应式节点。
 *
 * 当使用 reactive 函数创建一个反应式对象后，访问该对象的属性时，会创建一个 ReactiveGetValueNode 对象。
 *
 * 当设置反应式对象对应属性值时，会触发该节点。
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

