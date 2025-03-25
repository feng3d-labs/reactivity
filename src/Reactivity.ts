/**
 * 反应式节点。
 */
export class Reactivity<T = any>
{
    /**
     * 父反应节点。
     *
     * 记录了哪些节点调用了当前节点。
     */
    parents = new Set<Reactivity>();

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
        this.run();

        return this._value;
    }
    protected _value: T;

    /**
     * 执行当前节点。
     */
    run()
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
                this.markDirty(newValue, oldValue);
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
    markDirty(newValue?: T, oldValue?: T)
    {
        if (this.dirty)
        {
            return;
        }
        this.dirty = true;

        this.invalidate(newValue, oldValue);
    }

    /**
     * 当节点失效时调用。
     */
    onInvalidate: () => void;

    /**
     * 当前节点失效。
     * 
     * 把当前节点添加到父节点的失效队列中。
     */
    private invalidate(newValue?: T, oldValue?: T)
    {
        // 冒泡到所有父节点，设置失效子节点。
        if (this.parents.size > 0)
        {
            this.parents.forEach((parent) =>
            {
                // 添加到队尾
                const node: ReactivityLink = { node: this, value: oldValue ?? this._value, next: undefined };
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

        if (this.onInvalidate)
        {
            // 独立执行回调
            const pre = activeReactivity;
            activeReactivity = null;

            // 执行回调。
            this.onInvalidate();

            activeReactivity = pre;
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
let activeReactivity: Reactivity;

/**
 * 反应式节点链。
 */
type ReactivityLink = { node: Reactivity, value: any, next: ReactivityLink };