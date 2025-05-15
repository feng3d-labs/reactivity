import { batch, batchRun } from './batch';
import { ComputedReactivity } from './computed';
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
export function effect<T = any>(fn: () => T): Effect
{
    return new EffectReactivity(fn);
}

/**
 * 效果反应式节点。
 */
export class EffectReactivity<T = any> extends ComputedReactivity<T> implements Effect
{
    /**
     * 是否为启用, 默认为 true。
     *
     * 启用时，会立即执行函数。
     */
    private _isEnable = true;

    /**
     * 是否为暂停, 默认为 false。
     *
     * 暂停时，不会执行函数。
     */
    private _isPaused = false;

    constructor(func: (oldValue?: T) => T)
    {
        super(func);
        this.runIfDirty();
    }

    pause()
    {
        this._isEnable = false;
        this._isPaused = true;
    }

    resume()
    {
        if (this._isEnable) return;
        this._isEnable = true;
        if (EffectReactivity.pausedQueueEffects.has(this))
        {
            EffectReactivity.pausedQueueEffects.delete(this);
            this.trigger();
        }
        this._isPaused = false;
    }

    trigger()
    {
        batchRun(() =>
        {
            super.trigger();

            if (this._isEnable)
            {
                // 合批时需要判断是否已经运行的依赖。
                batch(this, Reactivity.activeReactivity === this);
            }
            else
            {
                EffectReactivity.pausedQueueEffects.add(this);
            }
        });
    }
    private static pausedQueueEffects = new WeakSet<EffectReactivity>();

    /**
     * 执行当前节点。
     *
     * 当暂停时将会直接执行被包装的函数。
     */
    run(): void
    {
        if (this._isEnable)
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
}
