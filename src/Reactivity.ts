import { type ComputedReactivity } from './computed';

/**
 * 反应式节点。
 *
 * 拥有节点值以及被捕捉与触发的能力。
 *
 * 用于被 computed effect 等构建的节点所继承。
 */
export class Reactivity<T = any>
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
     * 版本号。
     * 
     * 重新计算后自动递增。用于判断子节点中的父节点引用是否过期。
     *
     * @private
     */
    _version = -1;

    /**
     * 父反应节点。
     *
     * 记录了哪些节点调用了当前节点。
     *
     * 当前节点失效时，会通知并移除所有父节点。
     *
     * @private
     */
    _parents = new Map<ComputedReactivity, number>();

    /**
     * 捕捉。
     *
     * 建立与父节点的依赖关系。
     */
    track()
    {
        if (!_shouldTrack) return;

        // 连接父节点和子节点。
        const parent = Reactivity.activeReactivity;
        if (parent)
        {
            this._parents.set(parent, parent._version);
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
        this._parents.forEach((version, parent) =>
        {
            if (parent._version !== version) return;

            parent.trigger();
            // 失效时添加子节点到父节点中。
            parent._children.set(this, this._version);
        });

        //
        this._parents.clear();
    }

    /**
     * 当前正在执行的反应式节点。
     *
     * @internal
     */
    static activeReactivity: ComputedReactivity;
}

/**
 * 反应式节点链。
 */
export type ReactivityLink = { node: Reactivity, value: any, next: ReactivityLink };

/**
 * 强制跟踪。
 *
 * @param fn 强制跟踪的函数。
 */
export function forceTrack<T>(fn: () => T): T
{
    const preShouldTrack = _shouldTrack;
    _shouldTrack = true;
    const result = fn();
    _shouldTrack = preShouldTrack;

    return result;
}

/**
 * 不跟踪。
 *
 * @param fn 不跟踪的函数。
 */
export function noTrack<T>(fn: () => T): T
{
    const preShouldTrack = _shouldTrack;
    _shouldTrack = false;
    const result = fn();
    _shouldTrack = preShouldTrack;

    return result;
}

/**
 * 是否应该跟踪的标志
 * 控制是否进行依赖跟踪
 *
 * @private
 */
let _shouldTrack = true;
