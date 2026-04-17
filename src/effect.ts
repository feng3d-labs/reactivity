import { batch, batchRun } from './batch';
import { ComputedReactivity } from './computed';
import { activeEffectScope } from './effectScope';
import { Reactivity } from './Reactivity';

/**
 * 创建效果反应式节点。
 *
 * 将会维持反应式效果，当被作用的函数所引用的响应式对象发生变化时，会立即执行 fn 函数。
 *
 * @param fn 要执行的函数
 * @returns  暂停和恢复副作用的函数
 *
 * 注：
 * 1. 与 `@vue/reactivity` 中的 effect 不同，此函数返回的是一个 Effect 对象，而不是一个函数。
 * 2. 不希望用户直接执行，而是通过反应式自动触发。
 * 3. 真有需求，可以使用 effect(func).run(true) 来代替 @vue/reactivity 中的 effect(func)() 。
 *
 */
export function effect(fn: () => void): Effect
{
    return new EffectReactivity(fn);
}

/**
 * 效果反应式节点。
 */
export class EffectReactivity extends ComputedReactivity<void> implements Effect
{
    /** 是否启用 */
    private _enabled = true;
    /** 暂停期间是否有依赖变化 */
    private _pending = false;

    constructor(func: () => void)
    {
        super(func);
        if (activeEffectScope && activeEffectScope.active)
        {
            activeEffectScope.effects.push(this);
        }
        this.runIfDirty();
    }

    /**
     * 暂停效果。
     *
     * 暂停后，当依赖发生变化时不会自动执行。
     */
    pause()
    {
        this._enabled = false;
    }

    /**
     * 恢复效果。
     *
     * 恢复后，当依赖发生变化时会自动执行。
     */
    resume()
    {
        if (this._enabled) return;
        this._enabled = true;
        if (this._pending)
        {
            this._pending = false;
            this.trigger();
        }
    }

    /**
     * 停止效果。
     *
     * 停止后，效果将不再响应依赖的变化。
     */
    stop()
    {
        this._enabled = false;
        this._pending = false;
    }

    /**
     * 触发效果执行。
     *
     * 当依赖发生变化时，会调用此方法。
     */
    trigger()
    {
        batchRun(() =>
        {
            super.trigger();

            if (this._enabled)
            {
                // 合批时需要判断是否已经运行的依赖。
                batch(this, Reactivity.activeReactivity === this);
            }
            else
            {
                this._pending = true;
            }
        });
    }

    /**
     * 执行当前节点。
     *
     * 当暂停时将会直接执行被包装的函数。
     */
    run(): void
    {
        if (this._enabled)
        {
            super.run();
        }
        else
        {
            this._func(this._value);
        }
    }
}

/**
 * 维持反应式效果。
 */
export interface Effect
{
    /**
     * 暂停。
     */
    pause: () => void;

    /**
     * 恢复。
     */
    resume: () => void;

    /**
     * 停止。
     */
    stop: () => void;
}
