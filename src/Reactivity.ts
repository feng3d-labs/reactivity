/**
 * 当前正在执行的反应式节点。
 */
let activeReactivity: Reactivity;

type ReactivityLink = { node: Reactivity, value: any, next: ReactivityLink };

/**
 * 反应式基本对象。
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
     * 失效的子节点，需要在执行时检查子节点值是否发生变化。
     */
    invalidChildren: ReactivityLink;

    /**
     * 当前节点值。
     */
    get value()
    {
        this.run();

        return this._value;
    }
    protected _value: T;

    constructor()
    {
    }

    /**
     * 执行当前节点。
     */
    run()
    {
        const parentReactiveNode = activeReactivity;
        activeReactivity = this;

        let node = this.invalidChildren;
        while (node)
        {
            if (node.value !== node.node.value)
            {
                this.markDirty();
            }

            node = node.next;
        }
        this.invalidChildren = undefined as any;

        //
        // 保存当前节点作为父节点。
        // 设置当前节点为父节点。
        if (this.dirty)
        {
            this._value = this._runSelf();

            // 连接父节点和子节点。
            if (parentReactiveNode)
            {
                this.parents.add(parentReactiveNode);
            }
            //
            this.dirty = false;
        }

        // 执行完毕后恢复父节点。
        activeReactivity = parentReactiveNode;
    }

    /**
     * 标记为脏，触发更新。
     */
    markDirty()
    {
        if (this.dirty)
        {
            return;
        }
        this.dirty = true;

        this.invalidate();

        //
        this.parents.clear();
    }

    invalidate()
    {
        //
        if (this.parents.size > 0)
        {
            this.parents.forEach((parent) =>
            {
                const node: ReactivityLink = { node: this, value: this._value, next: parent.invalidChildren };
                parent.invalidChildren = node;
                parent.invalidate();
            });
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
