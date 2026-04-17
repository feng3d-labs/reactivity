import { batch, batchRun, getBatchDepth } from './batch';
import { activeEffectScope } from './effectScope';
import { forceTrack, Reactivity } from './Reactivity';

/**
 * 性能优化尝试记录：
 *
 * 当前保留的有效优化（经测试验证有效）：
 *
 * 1. 快速路径检查：
 *    - 未启用的 effect 直接加入暂停队列，避免后续处理
 *
 * 2. 跳过 super.trigger()：
 *    - effect 通常没有父节点（不像 computed），跳过不必要的调用
 *
 * 3. 避免嵌套批次：
 *    - 使用 getBatchDepth() 检查，已在批次中时直接加入队列
 *    - 避免创建不必要的 batchRun 包装函数
 *
 * 性能测试结果：约 3.5-4 倍于 @vue/reactivity（2026-04-16 测试）
 */

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
export class EffectReactivity implements Effect
{
    /** 是否启用 */
    private _enabled = true;
    /** 暂停期间是否有依赖变化 */
    private _pending = false;

    private _isRunning = false;

    /**
     * 版本号。
     *
     * 每次重新计算后自动递增。
     * 用于判断子节点中的父节点引用是否过期。
     * 当子节点发现父节点的版本号不匹配时，会重新建立依赖关系。
     *
     * @private
     */
    _version = -1;

    protected _func: () => void;

    constructor(func: () => void)
    {
        this._func = func;
        if (activeEffectScope && activeEffectScope.active)
        {
            activeEffectScope.effects.push(this);
        }
        this.runIfDirty();
    }

    runIfDirty()
    {
        // 执行计算
        this.run();
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

        const hadPending = this._pending;

        this._enabled = true;
        this._pending = false;

        if (hadPending) this.trigger();
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
        // 优化：快速路径 - 如果未启用，标记为待处理
        if (!this._enabled)
        {
            this._pending = true;

            return;
        }

        // 优化：直接调用 batch()，避免函数分配
        // 检查是否正在运行（作为 computed 的内部依赖）
        const isRunning = Reactivity.activeReactivity === this;

        if (isRunning || getBatchDepth() > 0)
        {
            // 已在批次上下文中，直接加入队列
            batch(this, isRunning);
        }
        else
        {
            // 创建新的批次上下文
            batchRun(() => batch(this, false));
        }
    }

    /**
     * 执行当前节点。
     *
     * 当暂停时将会直接执行被包装的函数。
     */
    run(): void
    {
        if (this._isRunning) return;
        this._isRunning = true;

        if (this._enabled)
        {
            // 不受嵌套的 effect 影响
            forceTrack(() =>
            {
                // 保存当前节点作为父节点
                const parentReactiveNode = Reactivity.activeReactivity;

                // 设置当前节点为活跃节点
                Reactivity.activeReactivity = this;

                this._version++;
                this._func();

                // 执行完毕后恢复父节点
                Reactivity.activeReactivity = parentReactiveNode;
            });
        }
        else
        {
            this._func();
        }

        this._isRunning = false;
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
