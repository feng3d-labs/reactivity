/**
 * 基础反应式节点。
 * 
 * 用于被 ref reactive 等构建的节点所继承。
 */
export class BaseDep<T>
{
    /**
     * 获取当前节点值。
     * 
     * 取值时将会建立与父节点的依赖关系。
     */
    get value(): T
    {
        this.track();
        return this._value;
    }
    /**
     * @private
     */
    _value: T;

    /**
     * 父反应节点。
     *
     * 记录了哪些节点调用了当前节点。
     */
    parents = new Set<Dep>();

    /**
     * 建立与父节点的依赖关系。
     */
    track()
    {
        if (!Dep._shouldTrack) return;

        // 连接父节点和子节点。
        if (Dep.activeReactivity)
        {
            this.parents.add(Dep.activeReactivity);
        }
    }
}

/**
 * 反应节点。
 *
 * 用于记录依赖关系。
 * 
 * 用于被 computed effect 等构建的节点所继承。
 */
export class Dep<T = any> extends BaseDep<T>
{
    /**
     * 失效的子节点的队头。需要在执行时检查子节点值是否发生变化。
     */
    protected _invalidChildrenHead: ReactivityLink;

    /**
     * 失效子节点的队尾。用于保持检查顺序。新增节点添加到队尾，从队头开始检查。
     */
    protected _invalidChildrenTail: ReactivityLink;

    /**
     * 当前节点失效。
     * 
     * 把当前节点添加到父节点的失效队列中。
     */
    trigger()
    {
        // 冒泡到所有父节点，设置失效子节点。
        if (this.parents.size > 0)
        {
            this.parents.forEach((parent) =>
            {
                // 添加到队尾
                const node: ReactivityLink = { node: this, value: this._value, next: undefined };
                if (parent._invalidChildrenTail)
                {
                    parent._invalidChildrenTail.next = node;
                    parent._invalidChildrenTail = node;
                }
                else
                {
                    parent._invalidChildrenTail = node;
                    parent._invalidChildrenHead = node;
                }
                parent.trigger();
            });

            //
            this.parents.clear();
        }
    }

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
}

/**
 * 反应式节点链。
 */
type ReactivityLink = { node: Dep, value: any, next: ReactivityLink };
