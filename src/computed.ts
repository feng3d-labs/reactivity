import { Dep } from "./dep";

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
    private _func: (oldValue?: T) => T;

    /**
     * 失效的子节点的队头。需要在执行时检查子节点值是否发生变化。
     */
    protected _invalidChildrenHead: ReactivityLink;

    /**
     * 失效子节点的队尾。用于保持检查顺序。新增节点添加到队尾，从队头开始检查。
     */
    protected _invalidChildrenTail: ReactivityLink;

    /**
     * 是否脏，是否需要重新计算。
     * 
     * 用于在没有值发生变化时，避免重复计算。
     */
    protected _needRun = true;

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
     * 建立与父节点的依赖关系。
     * 
     * 当需要执行或者
     */
    track()
    {
        this.run();

        super.track();
    }

    trigger(dep?: Dep): void
    {
        if (dep)
        {
            // 添加到队尾
            const node: ReactivityLink = { node: dep, value: dep._value, next: undefined };
            if (this._invalidChildrenTail)
            {
                this._invalidChildrenTail.next = node;
                this._invalidChildrenTail = node;
            }
            else
            {
                this._invalidChildrenTail = node;
                this._invalidChildrenHead = node;
            }
        }
        super.trigger();
    }

    /**
     * 执行当前节点。
     */
    run()
    {
        // 检查是否存在失效子节点。
        this._needRun = this._needRun || this.isChildrenChanged();

        // 标记为脏的情况下，执行计算。
        if (this._needRun)
        {
            // 立即去除脏标记，避免循环多重计算。
            this._needRun = false;

            // 保存当前节点作为父节点。
            const parentReactiveNode = Dep.activeReactivity;
            // 设置当前节点为活跃节点。
            Dep.activeReactivity = this as any;

            this._value = this._func(this._value);

            // 执行完毕后恢复父节点。
            Dep.activeReactivity = parentReactiveNode;
        }
    }

    /**
     * 判断子节点是否发生变化。
     */
    protected isChildrenChanged()
    {
        let isChanged = false;
        // 在没有标记脏的情况下，检查子节点是否存在值发生变化的。
        if (this._invalidChildrenHead)
        {
            // 避免在检查过程建立依赖关系。
            const preReactiveNode = Dep.activeReactivity;
            Dep.activeReactivity = null;

            // 检查子节点是否是否存在值发生变化的。
            let invalidChild = this._invalidChildrenHead;
            while (invalidChild)
            {
                // 修复与子节点关系
                invalidChild.node._parents.add(this as any);
                // 检查子节点值是否发生变化。
                // 注：node.node.value 将会触发 node.node.run()，从而更新 node.value。
                const newValue = invalidChild.node.value;
                const oldValue = invalidChild.value;
                if (newValue !== oldValue)
                {
                    // 只需发现一个变化的子节点，标记当前节点为脏，需要执行计算。
                    isChanged = true;
                    break;
                }

                //
                invalidChild = invalidChild.next;
            }

            // 恢复父节点。
            Dep.activeReactivity = preReactiveNode;
        }
        // 清空失效子节点队列。
        this._invalidChildrenHead = undefined as any;
        this._invalidChildrenTail = undefined as any;

        return isChanged;
    }
}

/**
 * 反应式节点链。
 */
type ReactivityLink = { node: Dep, value: any, next: ReactivityLink };