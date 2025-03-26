import { TrackOpTypes, TriggerOpTypes } from "./shared/constants";
import { isArray, isIntegerKey, isMap, isSymbol } from "./shared/general";

/**
 * 追踪属性的变化。
 * 
 * 当属性被访问时，将会追踪属性的变化。
 *
 * @param target 目标对象。
 * @param key  属性名。
 * @returns 
 */
export function track(target: object, type: TrackOpTypes, key: unknown): void
{
    if (!shouldTrack) return;

    let depsMap = targetMap.get(target);
    if (!depsMap)
    {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }

    //
    let dep = depsMap.get(key);
    if (!dep)
    {
        dep = new Dep();
        depsMap.set(key, dep);
    }

    // 取值，建立依赖关系。
    dep.track();
}
const targetMap: WeakMap<any, Map<any, Dep>> = new WeakMap()

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
export function trigger(target: object, type: TriggerOpTypes, key?: unknown, newValue?: unknown, oldValue?: unknown,): void
{
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    const run = (dep: Dep | undefined) =>
    {
        if (dep)
        {
            // 触发属性的变化。
            dep.trigger(newValue, oldValue);
        }
    }

    startBatch()

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

    endBatch();
}

/**
 * 反应节点。
 *
 * 用于记录依赖关系。
 */
export class Dep<T = any>
{
    /**
     * 父反应节点。
     *
     * 记录了哪些节点调用了当前节点。
     */
    parents = new Set<Dep>();

    /**
     * 是否脏，是否需要重新计算。
     */
    dirty = true;

    /**
     * 失效的子节点的队头。需要在执行时检查子节点值是否发生变化。
     */
    invalidChildrenHead: ReactivityLink;
    /**
     * 失效子节点的队尾。用于保持检查顺序。新增节点添加到队尾，从队头开始检查。
     */
    invalidChildrenTail: ReactivityLink;

    /**
     * 当前节点值。
     * 
     * 取值时将会更新当前节点（建立或维护依赖关系，标记为脏时执行）。
     */
    get value()
    {
        this.track();

        return this._value;
    }
    protected _value: T;

    /**
     * 是否为效果节点。
     */
    isEffect: boolean = false;

    /**
     * 执行当前节点。
     */
    track()
    {
        if (!shouldTrack) return;

        this.run();

        // 连接父节点和子节点。
        if (activeReactivity)
        {
            this.parents.add(activeReactivity);
        }
    }

    /**
     * 执行当前节点。
     */
    run()
    {
        // 检查是否存在失效子节点。
        this.handleInvalidChildren();

        // 标记为脏的情况下，执行计算。
        if (this.dirty)
        {
            // 保存当前节点作为父节点。
            const parentReactiveNode = activeReactivity;
            // 设置当前节点为活跃节点。
            activeReactivity = this;

            this._value = this._runSelf();

            // 连接父节点和子节点。
            if (parentReactiveNode)
            {
                this.parents.add(parentReactiveNode);
            }

            // 执行完毕后恢复父节点。
            activeReactivity = parentReactiveNode;

            //
            this.dirty = false;
        }
    }

    /**
     * 处理失效节点。
     * 
     * 如果没有标记脏的情况下，则需要检查子节点是否存在值发生变化的，如果存在，则标记当前节点为脏，需要执行计算。
     */
    protected handleInvalidChildren()
    {
        // 在没有标记脏的情况下，检查子节点是否存在值发生变化的。
        if (!this.dirty && this.invalidChildrenHead)
        {
            // 避免在检查过程建立依赖关系。
            const preReactiveNode = activeReactivity;
            activeReactivity = null;

            // 检查子节点是否是否存在值发生变化的。
            let invalidChild = this.invalidChildrenHead;
            while (invalidChild)
            {
                // 修复与子节点关系
                invalidChild.node.parents.add(this);
                // 检查子节点值是否发生变化。
                // 注：node.node.value 将会触发 node.node.run()，从而更新 node.value。
                const newValue = invalidChild.node.value;
                const oldValue = invalidChild.value;
                if (newValue !== oldValue)
                {
                    // 只需发现一个变化的子节点，标记当前节点为脏，需要执行计算。
                    this.dirty = true;
                    break;
                }

                //
                invalidChild = invalidChild.next;
            }

            // 恢复父节点。
            activeReactivity = preReactiveNode;
        }
        // 清空失效子节点队列。
        this.invalidChildrenHead = undefined as any;
        this.invalidChildrenTail = undefined as any;

        return this.dirty;
    }

    /**
     * 标记为脏，触发下次检查与执行。
     */
    trigger(newValue?: T, oldValue?: T)
    {
        oldValue ??= this._value;
        this._value = newValue;
        if (this.dirty)
        {
            return;
        }
        this.dirty = true;

        this.invalidate(newValue, oldValue);
    }

    /**
     * 当前节点失效。
     * 
     * 把当前节点添加到父节点的失效队列中。
     */
    private invalidate(newValue?: T, oldValue?: T)
    {
        startBatch();

        // 冒泡到所有父节点，设置失效子节点。
        if (this.parents.size > 0)
        {
            this.parents.forEach((parent) =>
            {
                // 添加到队尾
                const node: ReactivityLink = { node: this, value: oldValue, next: undefined };
                if (parent.invalidChildrenTail)
                {
                    parent.invalidChildrenTail.next = node;
                }
                else
                {
                    parent.invalidChildrenTail = node;
                    parent.invalidChildrenHead = node;
                }
                parent.invalidate();
            });

            //
            this.parents.clear();
        }

        // 不是正在运行的效果节点
        if (this.isEffect && activeReactivity !== this)
        {
            batch(this)
        }

        endBatch();
    }

    /**
     * 执行当前节点自身。
     */
    protected _runSelf(): T
    {
        return this._value;
    }
}

export const ITERATE_KEY: unique symbol = Symbol(__DEV__ ? 'Object iterate' : '');
export const MAP_KEY_ITERATE_KEY: unique symbol = Symbol(__DEV__ ? 'Map keys iterate' : '')
export const ARRAY_ITERATE_KEY: unique symbol = Symbol(__DEV__ ? 'Array iterate' : '')

/**
 * 当前正在执行的反应式节点。
 */
let activeReactivity: Dep;

/**
 * 反应式节点链。
 */
type ReactivityLink = { node: Dep, value: any, next: ReactivityLink };

/**
 * 是否应该跟踪的标志
 * 控制是否进行依赖跟踪
 */
let shouldTrack = true
const trackStack: boolean[] = []

/**
 * 暂停跟踪
 * 暂时停止依赖跟踪
 */
export function pauseTracking(): void
{
    trackStack.push(shouldTrack)
    shouldTrack = false
}

/**
 * 重置跟踪状态
 * 恢复之前的全局依赖跟踪状态
 */
export function resetTracking(): void
{
    const last = trackStack.pop()
    shouldTrack = last === undefined ? true : last
}

export function startBatch(): void
{
    batchDepth++
}

export function endBatch(): void
{
    if (--batchDepth > 0)
    {
        return
    }

    // 批次处理
    if (needEffectDeps.length > 0)
    {
        needEffectDeps.forEach((dep) =>
        {
            // 独立执行回调
            const pre = activeReactivity;
            activeReactivity = null;

            dep.run()

            activeReactivity = pre;
        });
        needEffectDeps.length = 0;
    }
}

export function batch(dep: Dep): void
{
    needEffectDeps.push(dep);
}

let batchDepth = 0
let needEffectDeps: Dep[] = [];