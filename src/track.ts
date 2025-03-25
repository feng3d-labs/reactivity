import { Reactivity } from "./Reactivity";
import { TrackOpTypes, TriggerOpTypes } from "./shared/constants";

/**
 * 追踪属性的变化。
 * 
 * 当属性被访问时，将会追踪属性的变化。
 *
 * @param target 目标对象。
 * @param property  属性名。
 * @returns 
 */
export function track<T, K extends keyof T>(target: T, type: TrackOpTypes, property: K): void
{
    let depsMap = targetMap.get(target);
    if (!depsMap)
    {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }

    //
    let dep = depsMap.get(property);
    if (!dep)
    {
        dep = new Reactivity();
        depsMap.set(property, dep);
    }

    // 取值，建立依赖关系。
    dep.track();
}
const targetMap: WeakMap<any, Map<any, Reactivity>> = new WeakMap()

/**
 * 触发属性的变化。
 * 
 * @param target 目标对象。
 * @param type    操作类型。
 * @param property 属性名。
 * @param newValue 新值。
 * @param oldValue 旧值。
 * @returns 
 */
export function trigger<T, K extends keyof T>(target: T, type: TriggerOpTypes, property: K, newValue?: T[K], oldValue?: T[K]): void
{
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(property);
    if (!dep) return;

    dep.trigger(newValue, oldValue);
}