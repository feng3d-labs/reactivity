import { batch } from './batch';
import { Reactivity, ReactivityLink, forceTrack } from './Reactivity';
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
    return new ComputedReactivity(func) as any;
}

/**
 * 计算反应式对象。
 */
export interface Computed<T = any>
{
    readonly value: T
    [ComputedSymbol]: true
}
declare const ComputedSymbol: unique symbol;

export interface ComputedReactivity<T = any> extends Computed<T> { }

/**
 * 计算反应式节点。
 *
 * 当使用 computed 函数时，会创建一个 ComputedDep 对象。
 *
 * 首次获取值将会执行函数，后续获取值且在依赖发生变化的情况下将会重新计算。
 */
export class ComputedReactivity<T = any> extends Reactivity<T>
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
     * 失效子节点表头。
     *
     * @private
     *
     * ### 注意
     * （综合性能远大于全量链表与字典）为了性能，选择使用失效子节点链表形式放弃使用全量子节点链表与字典形式维护子节点。
     *
     * ### 存在隐患
     * 1. 存在过期子节点还会引用父节点情况，会导致过期的触发（可能影响性能）。
     * 2. 只能按照触发时顺序遍历失效子节点，无法按照捕获时顺序遍历失效子节点（可能影响性能）。
     */
    _childrenHead: ReactivityLink;

    /**
     * 失效子节点表尾。
     *
     * 用于新增失效子节点到表尾。
     *
     * @private
     */
    _childrenTail: ReactivityLink;

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
     * 冒泡到所有父节点，设置失效子节点链表。
     *
     * 把触发节点添加到失效子节点链表队列中。
     */
    trigger(): void
    {
        if (Reactivity.activeReactivity === this)
        {
            batch(this, Reactivity.activeReactivity === this);
        }

        super.trigger();
    }

    /**
     * 执行当前节点。
     */
    run()
    {
        // 不受嵌套的 effect 影响。
        forceTrack(() =>
        {
            // 保存当前节点作为父节点。
            const parentReactiveNode = Reactivity.activeReactivity;
            // 设置当前节点为活跃节点。
            Reactivity.activeReactivity = this as any;

            this._value = this._func(this._value);

            // 执行完毕后恢复父节点。
            Reactivity.activeReactivity = parentReactiveNode;
        });
    }

    /**
     * 检查当前节点是否脏。
     *
     * 如果脏，则执行计算。
     */
    runIfDirty()
    {
        // 检查是否存在失效子节点链表。
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
        if (!this._childrenHead) return false;

        // 检查是否存在子节点发生变化。
        let isChanged = false;

        // 避免在检查过程建立依赖关系。
        const preReactiveNode = Reactivity.activeReactivity;
        Reactivity.activeReactivity = null;

        // 检查子节点是否发生变化。
        for (let node = this._childrenHead; node; node = node.next)
        {
            const oldValue = node.value;
            const newValue = node.node.value;
            if (hasChanged(oldValue, newValue))
            {
                isChanged = true;
                break;
            }
        }

        // 恢复父节点。
        Reactivity.activeReactivity = preReactiveNode;

        if (!isChanged)
        {
            // 修复与子节点关系
            for (let node = this._childrenHead; node; node = node.next)
            {
                node.node._parents.add(this);
            }
        }

        // 清空子节点。
        this._childrenHead = undefined;
        this._childrenTail = undefined;

        return isChanged;
    }
}

