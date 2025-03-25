import { Reactivity } from "./Reactivity";
import { TrackOpTypes } from "./shared/constants";

export const targetMap: WeakMap<object, Map<any, Reactivity>> = new WeakMap()

export function track(target: object, type: TrackOpTypes, property: unknown): void
{
    let depMap = targetMap.get(target);
    if (!depMap)
    {
        depMap = new Map();
        targetMap.set(target, depMap);
    }

    let dep = depMap.get(property);
    if (!dep)
    {
        dep = new PropertyReactivity(target, property);
        depMap.set(property, dep);
    }
    // 取值
    dep.value;
}

class PropertyReactivity<T> extends Reactivity<T>
{
    get value()
    {
        // 如果目标对象的值已经发生变化（存在在没有使用反应式的情况下赋值），则标记为脏，并重新计算。
        if (this._value !== this.target[this.property])
        {
            console.warn("不推荐对已经使用反应式的对象直接赋值！", this.target, this.property);
            // 标记为脏。
            this._value = this.target[this.property]
            this.markDirty(this.target[this.property], this._value);
        }
        this.run();
        return this._value;
    }
    set value(v)
    {
        if (this._value !== this.target[this.property])
        {
            console.warn("不推荐对已经使用反应式的对象直接赋值！", this.target, this.property);
            //
        }
        else if (this._value === v) return;
        // 如果缓存的值与目标对象的值相同，则直接返回。
        if (this._value === v && this.target[this.property] === v) return;
        const oldValue = this._value;
        this._value = this.target[this.property] = v;
        this.markDirty(v, oldValue);
    }

    constructor(public target: object, public property: any)
    {
        super();
    }

    protected _runSelf(): any
    {
        return this.target[this.property];
    }
}