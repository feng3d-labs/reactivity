/**
 * 反应节点。
 *
 * 用于记录依赖关系。
 */
export class Dep<T = any>
{
    /**
     * 当前正在执行的反应式节点。
     * 
     * @internal
     */
    static activeReactivity: Dep;

    /**
     * 是否应该跟踪的标志
     * 控制是否进行依赖跟踪
     * 
     * @private
     */
    static _shouldTrack = true

    /**
     * @private
     */
    private static _trackStack: boolean[] = []

    /**
     * 暂停跟踪
     * 暂时停止依赖跟踪
     */
    static pauseTracking(): void
    {
        Dep._trackStack.push(Dep._shouldTrack)
        Dep._shouldTrack = false
    }

    /**
     * 重置跟踪状态
     * 恢复之前的全局依赖跟踪状态
     */
    static resetTracking(): void
    {
        const last = Dep._trackStack.pop()
        Dep._shouldTrack = last === undefined ? true : last
    }

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
     * 执行当前节点。
     */
    track()
    {
        if (!Dep._shouldTrack) return;

        this.run();

        // 连接父节点和子节点。
        if (Dep.activeReactivity)
        {
            this.parents.add(Dep.activeReactivity);
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
            // 立即去除脏标记，避免循环多重计算。
            this.dirty = false;

            // 保存当前节点作为父节点。
            const parentReactiveNode = Dep.activeReactivity;
            // 设置当前节点为活跃节点。
            Dep.activeReactivity = this;

            this._value = this._runSelf();

            // 连接父节点和子节点。
            if (parentReactiveNode)
            {
                this.parents.add(parentReactiveNode);
            }

            // 执行完毕后恢复父节点。
            Dep.activeReactivity = parentReactiveNode;
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
            const preReactiveNode = Dep.activeReactivity;
            Dep.activeReactivity = null;

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
            Dep.activeReactivity = preReactiveNode;
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
    protected invalidate(newValue?: T, oldValue?: T)
    {
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
 * 反应式节点链。
 */
type ReactivityLink = { node: Dep, value: any, next: ReactivityLink };
