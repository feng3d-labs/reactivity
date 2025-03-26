import { TrackOpTypes, TriggerOpTypes } from "./shared/constants";

/**
 * 追踪属性的变化。
 * 
 * 当属性被访问时，将会追踪属性的变化。
 *
 * @param target 目标对象。
 * @param key  属性名。
 * @returns 
 */
export function track<T, K extends keyof T>(target: T, type: TrackOpTypes, key: K): void
{
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
export function trigger<T, K extends keyof T>(target: T, type: TriggerOpTypes, key: K, newValue?: T[K], oldValue?: T[K]): void
{
    const depsMap = targetMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(key);
    if (!dep) return;

    // 触发属性的变化。
    dep.trigger(newValue, oldValue);
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
     * 当节点失效时调用。
     */
    isEffect: boolean = false;

    /**
     * 执行当前节点。
     */
    track()
    {
        // 保存当前节点作为父节点。
        const parentReactiveNode = activeReactivity;
        // 设置当前节点为活跃节点。
        activeReactivity = this;

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
        this.invalidChildrenHead = undefined as any;
        this.invalidChildrenTail = undefined as any;

        //
        // 保存当前节点作为父节点。
        // 设置当前节点为父节点。
        if (this.dirty)
        {
            this._value = this._runSelf();

            //
            this.dirty = false;
        }

        // 连接父节点和子节点。
        if (parentReactiveNode)
        {
            this.parents.add(parentReactiveNode);
        }

        // 执行完毕后恢复父节点。
        activeReactivity = parentReactiveNode;
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
        count++;
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
        count--;

        // 不是正在运行的效果节点
        if (this.isEffect && activeReactivity !== this)
        {
            needEffectDeps.push(this);
        }

        if (count === 0 && needEffectDeps.length > 0)
        {
            needEffectDeps.forEach((dep) =>
            {
                // 独立执行回调
                const pre = activeReactivity;
                activeReactivity = null;

                dep.track()

                activeReactivity = pre;
            });
            needEffectDeps.length = 0;
        }
    }

    /**
     * 执行当前节点自身。
     */
    protected _runSelf(): T
    {
        return this._value;
    }
}

/**
 * 当前正在执行的反应式节点。
 */
let activeReactivity: Dep;

/**
 * 反应式节点链。
 */
type ReactivityLink = { node: Dep, value: any, next: ReactivityLink };

let count = 0;
let needEffectDeps: Dep[] = [];