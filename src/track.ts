import { Dep } from "./dep";
import { EffectDep } from "./effect";
import { ARRAY_ITERATE_KEY, ITERATE_KEY, MAP_KEY_ITERATE_KEY, TrackOpTypes, TriggerOpTypes } from "./shared/constants";
import { isArray, isIntegerKey, isMap, isSymbol } from "./shared/general";

export function property<T, K extends keyof T>(target: T, key: K)
{
    let depsMap = PropertyDep._targetMap.get(target);
    if (!depsMap)
    {
        depsMap = new Map();
        PropertyDep._targetMap.set(target, depsMap);
    }

    //
    let dep = depsMap.get(key);
    if (!dep)
    {
        dep = new PropertyDep(target, key);
        depsMap.set(key, dep);
    }

    return dep;
}

/**
 * 反应式属性。
 */
export class PropertyDep<T, K extends keyof T> extends Dep<T>
{
    /**
     * 获取当前节点值。
     * 
     * 取值时将会建立与父节点的依赖关系。
     */
    get value(): T
    {
        this.track();
        return this._value;
    }
    set value(v)
    {
        if (this._key === "length")
        {
            v = this._target["length"];
        }
        if (v === this._value) return;
        // 触发属性的变化。
        this.trigger();
        this._value = v;
    }

    private _target: T;
    private _key: K;

    constructor(target: T, key: K)
    {
        super();
        this._target = target;
        this._key = key;
        this._value = (target as any)[key as any];
    }

    triggerIfChanged()
    {

    }

    /**
     * 追踪属性的变化。
     * 
     * 当属性被访问时，将会追踪属性的变化。
     *
     * @param target 目标对象。
     * @param key  属性名。
     * @returns 
     */
    static track(target: object, type: TrackOpTypes, key: unknown): void
    {
        const dep = property(target as any, key as any);

        // 取值，建立依赖关系。
        dep.track();
    }
    /**
     * @private
     */
    static _targetMap: WeakMap<any, Map<any, PropertyDep<any, any>>> = new WeakMap()

    /**
     * 触发属性的变化。
     * 
     * @param target 目标对象。
     * @param type    操作类型。
     * @param key 属性名。
     * @param newValue 新值。
     * @param oldValue 旧值。
     * @returns 
     */
    static trigger(target: object, type: TriggerOpTypes, key?: unknown, newValue?: unknown, oldValue?: unknown): void
    {
        const depsMap = this._targetMap.get(target);
        if (!depsMap) return;

        const run = (dep: PropertyDep<any, any> | undefined) =>
        {
            if (dep)
            {
                // 触发属性的变化。
                dep.value = newValue;
            }
        }

        EffectDep.startBatch()

        if (type === TriggerOpTypes.CLEAR)
        {
            // collection being cleared
            // trigger all effects for target
            depsMap.forEach(run)
        } else
        {
            const targetIsArray = isArray(target)
            const isArrayIndex = targetIsArray && isIntegerKey(key)

            if (targetIsArray && key === 'length')
            {
                const newLength = Number(newValue)
                depsMap.forEach((dep, key) =>
                {
                    if (
                        key === 'length' ||
                        key === ARRAY_ITERATE_KEY ||
                        (!isSymbol(key) && key >= newLength)
                    )
                    {
                        run(dep)
                    }
                })
            } else
            {
                // schedule runs for SET | ADD | DELETE
                if (key !== void 0 || depsMap.has(void 0))
                {
                    run(depsMap.get(key))
                }

                // schedule ARRAY_ITERATE for any numeric key change (length is handled above)
                if (isArrayIndex)
                {
                    run(depsMap.get(ARRAY_ITERATE_KEY))
                }

                // also run for iteration key on ADD | DELETE | Map.SET
                switch (type)
                {
                    case TriggerOpTypes.ADD:
                        if (!targetIsArray)
                        {
                            run(depsMap.get(ITERATE_KEY))
                            if (isMap(target))
                            {
                                run(depsMap.get(MAP_KEY_ITERATE_KEY))
                            }
                        } else if (isArrayIndex)
                        {
                            // new index added to array -> length changes
                            run(depsMap.get('length'))
                        }
                        break
                    case TriggerOpTypes.DELETE:
                        if (!targetIsArray)
                        {
                            run(depsMap.get(ITERATE_KEY))
                            if (isMap(target))
                            {
                                run(depsMap.get(MAP_KEY_ITERATE_KEY))
                            }
                        }
                        break
                    case TriggerOpTypes.SET:
                        if (isMap(target))
                        {
                            run(depsMap.get(ITERATE_KEY))
                        }
                        break
                }
            }
        }

        EffectDep.endBatch();
    }
}