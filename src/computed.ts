import { batch } from './batch';
import { Dep } from './dep';
import { hasChanged } from './shared/general';

/**
 * 创建计算反应式对象。
 *
 * 首次获取值将会执行函数，后续获取值且在依赖发生变化的情况下将会重新计算。
 *
 * @param func 检测的可能包含响应式的函数。
 * @returns 包含 value 属性的对象，用于获取计算结果。
 */
export function computed<T>(func: (oldValue?: T) => T): Computed<T>
{
    return new ComputedDep(func) as any;
}

export interface Computed<T = any>
{
    readonly value: T
    [ComputedSymbol]: true
}
declare const ComputedSymbol: unique symbol;

export interface ComputedDep<T = any> extends Computed<T> { }

/**
 * 计算依赖。
 *
 * 当使用 computed 函数时，会创建一个 ComputedDep 对象。
 *
 * 首次获取值将会执行函数，后续获取值且在依赖发生变化的情况下将会重新计算。
 */
export class ComputedDep<T = any> extends Dep<T>
{
    /**
     * @internal
     */
    readonly __v_isRef = true;

    /**
     * 监听的函数。
     */
    protected _func: (oldValue?: T) => T;

    /**
     * 引用的子节点。
     *
     * @private
     *
     * ### 备注 （有损性能的选择）
     * 1. 子节点的维护放弃使用链表采用Map，遍历性能略有下降（看不出来），代码可读性提升。
     * 2. 放弃只维护失效子节点而选择保留全量子节点来确保遍历子节点时顺序不变。(检查遍历消耗可能更高，但捕获时可以更好的进行剪枝以及防止过期子节点触发来提升性能)
     */
    _children: Map<Dep, any> = new Map();

    /**
     * 是否脏，是否需要重新计算。
     *
     * 用于在没有值发生变化时，避免重复计算。
     *
     * @private
     */
    _isDirty = true;

    /**
     * 创建计算依赖。
     * @param func 检测的可能包含响应式的函数。
     */
    constructor(func: (oldValue?: T) => T)
    {
        super();
        this._func = func;
    }

    /**
     * 捕捉。
     *
     * 建立与父节点的依赖关系。
     */
    track()
    {
        this.runIfDirty();

        super.track();
    }

    /**
     * 触发。
     *
     * 冒泡到所有父节点，设置失效子节点。
     *
     * 把触发节点添加到失效子节点队列中。
     */
    trigger(): void
    {
        if (Dep.activeReactivity === this)
        {
            batch(this, Dep.activeReactivity === this);
        }

        super.trigger();
    }

    /**
     * 执行当前节点。
     */
    run()
    {
        // 不受嵌套的 effect 影响。
        const preShouldTrack = Dep._shouldTrack;
        Dep._shouldTrack = true;

        // 保存当前节点作为父节点。
        const parentReactiveNode = Dep.activeReactivity;
        // 设置当前节点为活跃节点。
        Dep.activeReactivity = this as any;

        this._value = this._func(this._value);

        // 执行完毕后恢复父节点。
        Dep.activeReactivity = parentReactiveNode;

        //
        Dep._shouldTrack = preShouldTrack;
    }

    /**
     * 检查当前节点是否脏。
     *
     * 如果脏，则执行计算。
     */
    runIfDirty()
    {
        // 检查是否存在失效子节点。
        this._isDirty = this._isDirty || this.isChildrenChanged();

        // 标记为脏的情况下，执行计算。
        if (this._isDirty)
        {
            // 立即去除脏标记，避免循环多重计算。
            this._isDirty = false;

            //
            this.run();
        }
    }

    /**
     * 判断子节点是否发生变化。
     */
    protected isChildrenChanged()
    {
        if (this._children.size === 0) return false;

        // 检查是否存在子节点发生变化。
        let isChanged = false;

        // 避免在检查过程建立依赖关系。
        const preReactiveNode = Dep.activeReactivity;
        Dep.activeReactivity = null;

        this._children.forEach((oldValue, child) =>
        {
            if (isChanged) return;
            if (child._parents.has(this)) return;

            const newValue = child.value;
            if (hasChanged(oldValue, newValue))
            {
                isChanged = true;
            }

            // 修复与子节点关系
            child._parents.add(this);
        });

        // 恢复父节点。
        Dep.activeReactivity = preReactiveNode;

        // 如果子节点有值发生变化，需要清除所有与子节点的关系。
        if (isChanged)
        {
            this._children.forEach((v, child) =>
            {
                child._parents.delete(this);
            });
            this._children.clear();
        }

        return isChanged;
    }
}
