import { type ComputedDep } from './computed';

/**
 * 反应节点。
 *
 * 用于记录依赖关系。
 *
 * 用于被 computed effect 等构建的节点所继承。
 */
export class Dep<T = any>
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
     *
     * 当前节点失效时，会通知并移除所有父节点。
     *
     * @private
     */
    _parents = new Set<ComputedDep>();

    /**
     * 捕捉。
     *
     * 建立与父节点的依赖关系。
     */
    track()
    {
        if (!Dep._shouldTrack) return;

        // 连接父节点和子节点。
        const parent = Dep.activeReactivity;
        if (parent)
        {
            this._parents.add(parent);
        }
    }

    /**
     * 触发。
     *
     * 冒泡到所有父节点，设置失效子节点链表。
     */
    trigger()
    {
        // 冒泡到所有父节点，设置失效子节点链表。
        if (this._parents.size > 0)
        {
            this._parents.forEach((parent) =>
            {
                // 失效时添加子节点到父节点的子节点表尾。
                const node = { node: this, value: this._value, next: parent._childrenTail };
                if (parent._childrenTail)
                {
                    parent._childrenTail.next = { node: this, value: this._value, next: undefined };
                    parent._childrenTail = parent._childrenTail.next;
                }
                else
                {
                    parent._childrenHead = parent._childrenTail = node;
                }

                parent.trigger();
            });

            //
            this._parents.clear();
        }
    }

    /**
     * 当前正在执行的反应式节点。
     *
     * @internal
     */
    static activeReactivity: ComputedDep;

    /**
     * 是否应该跟踪的标志
     * 控制是否进行依赖跟踪
     *
     * @private
     */
    static _shouldTrack = true;

    /**
     * @private
     */
    private static _trackStack: boolean[] = [];

    /**
     * 暂停跟踪
     * 暂时停止依赖跟踪
     */
    static pauseTracking(): void
    {
        Dep._trackStack.push(Dep._shouldTrack);
        Dep._shouldTrack = false;
    }

    /**
     * 重置跟踪状态
     * 恢复之前的全局依赖跟踪状态
     */
    static resetTracking(): void
    {
        const last = Dep._trackStack.pop();
        Dep._shouldTrack = last === undefined ? true : last;
    }
}

