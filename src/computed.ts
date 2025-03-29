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
     * 失效子节点。
     *
     * @private
     */
    _children = new Map<Reactivity, any>();

    /**
     * 是否脏，是否需要重新计算。
     *
     * 用于在没有值发生变化时，避免重复计算。
     *
     * @private
     */
    _isDirty = true;

    /**
     * 版本号。
     * 
     * 重新计算后自动递增。用于判断子节点中的父节点引用是否过期。
     *
     * @private
     */
    _version = -1;

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
     * 冒泡到所有父节点，设置失效子节点字典。
     *
     * 把触发节点添加到失效子节点字典队列中。
     */
    trigger(): void
    {
        // 正在运行时被触发，需要在运行结束后修复父子节点关系。
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

            this._version++;
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
        // 检查是否存在失效子节点字典。
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
        const preReactiveNode = Reactivity.activeReactivity;
        Reactivity.activeReactivity = null;

        // 检查子节点是否发生变化。
        this._children.forEach((value, node) =>
        {
            if(isChanged) return;
            if ( node.value !== value)
            {
                // 子节点变化，需要重新计算。
                isChanged = true;
                return;
            }
        });

        // 恢复父节点。
        Reactivity.activeReactivity = preReactiveNode;

        if (!isChanged)
        {
            // 修复与子节点关系
            this._children.forEach((version, node) =>
            {
                node._parents.set(this, this._version);
            });
        }

        // 清空子节点。
        this._children.clear();

        return isChanged;
    }
}

