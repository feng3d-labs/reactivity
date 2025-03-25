import { Reactivity } from "./Reactivity";

/**
 * 追踪属性的变化。
 * 
 * 当属性被访问时，将会追踪属性的变化。
 *
 * @param target 目标对象。
 * @param property 
 * @returns 
 */
export function property<T, K extends keyof T>(target: T, property: K): { value: T }
{
    let propertyReactivityMap = targetMap.get(target);
    if (!propertyReactivityMap)
    {
        propertyReactivityMap = new Map();
        targetMap.set(target, propertyReactivityMap);
    }

    //
    let propertyReactivity = propertyReactivityMap.get(property);
    if (!propertyReactivity)
    {
        propertyReactivity = new PropertyReactivity(target as any, property);
        propertyReactivityMap.set(property, propertyReactivity);
    }

    // 取值，建立依赖关系。
    propertyReactivity.value;

    //
    return propertyReactivity;
}
const targetMap: WeakMap<any, Map<any, PropertyReactivity>> = new WeakMap()

class PropertyReactivity extends Reactivity
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