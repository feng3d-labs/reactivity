import { batch } from "./batch";
import { Dep } from "./dep";
import { hasChanged } from "./shared/general";

/**
 * 创建计算反应式对象。
 * 
 * 首次获取值将会执行函数，后续获取值且在依赖发生变化的情况下将会重新计算。
 * 
 * @param func 检测的可能包含响应式的函数。
 * @returns 包含 value 属性的对象，用于获取计算结果。
 */
export function computed<T>(func: (oldValue?: T) => T): { readonly value: T }
{
    return new ComputedDep(func);
}

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
     * 监听的函数。
     */
    protected _func: (oldValue?: T) => T;

    /**
     * 子节点表头。
     * 
     * @private
     */
    _childrenHead: ReactivityLink;

    /**
     * 子节点表尾。
     * 
     * 新增子节点添加到表尾，保持顺序。
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
     * 冒泡到所有父节点，设置失效子节点。
     * 
     * 把触发节点添加到失效子节点队列中。
     * 
     * @param dep 触发节点。
     */
    trigger(dep?: Dep): void
    {
        if (Dep.activeReactivity === this)
        {
            batch(this, Dep.activeReactivity === this)
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
        if (!this._childrenHead) return false;

        // 检查是否存在子节点发生变化。
        let isChanged = false;

        // 避免在检查过程建立依赖关系。
        const preReactiveNode = Dep.activeReactivity;
        Dep.activeReactivity = null;

        let node = this._childrenHead;
        do
        {
            if (node.node._parents.has(this)) continue;

            // 检查子节点是否发生变化。
            const oldValue = node.value;
            const newValue = node.node.value;
            if (hasChanged(oldValue, newValue))
            {
                isChanged = true;
                break;
            }

            // 修复与子节点关系
            node.node._parents.add(this);
        } while (node = node.next);

        // 恢复父节点。
        Dep.activeReactivity = preReactiveNode;

        // 如果子节点有值发生变化，需要清除所有与子节点的关系。
        if (isChanged)
        {
            let node = this._childrenHead;
            while (node)
            {
                node.node._parents.delete(this);
                node = node.next;
            }

            // 清空子节点。
            this._childrenHead = undefined;
            this._childrenTail = undefined;
        }

        return isChanged;
    }
}

/**
 * 反应式节点链。
 */
type ReactivityLink = { node: Dep, value: any, next: ReactivityLink };