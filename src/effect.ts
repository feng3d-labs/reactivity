import { ComputedDep } from "./computed";
import { Dep } from "./dep";

/**
 * 创建副作用。
 * 
 * 被作用的函数所引用的响应式对象发生变化时，会立即执行 fn 函数。
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
    return new EffectDep(fn);
}

/**
 * 开始批次处理。
 */
export function startBatch()
{
    ComputedDep.startBatch();
}

/**
 * 结束批次处理。
 */
export function endBatch()
{
    ComputedDep.endBatch();
}

/**
 * 批次执行多次修改反应式对象，可以减少不必要的反应式触发。
 * 
 * ```ts
 * batchRun(() => {
 *     // 修改反应式对象
 *     reactiveObj.a = 1;
 *     reactiveObj.b = 2; 
 * })
 * ```
 * 
 * 等价于以下代码：
 * ```ts
 * startBatch();
 * reactiveObj.a = 1;
 * reactiveObj.b = 2;
 * endBatch();
 * ```
 * 
 * @param fn 要执行的函数，在此函数中多次修改反应式对象。
 */
export function batchRun(fn: () => void)
{
    startBatch();
    fn();
    endBatch();
}

/**
 * 副作用节点。
 */
export class EffectDep<T = any> extends ComputedDep<T> implements Effect
{
    /**
     * 是否为启用, 默认为 true。
     * 
     * 启用时，会立即执行函数。
     */
    private _isEnable: boolean = true;

    constructor(func: (oldValue?: T) => T)
    {
        super(func);
        this.runIfDirty();
    }

    pause()
    {
        this._isEnable = false;
    }

    resume()
    {
        if (this._isEnable) return;
        this._isEnable = true;
        if (EffectDep.pausedQueueEffects.has(this))
        {
            EffectDep.pausedQueueEffects.delete(this);
            this.trigger();
        }
    }

    trigger(dep?: Dep)
    {
        ComputedDep.startBatch();

        super.trigger(dep);

        if (this._isEnable)
        {
            // 合批时需要判断是否已经运行的依赖。
            ComputedDep.batch(this, Dep.activeReactivity === this)
        }
        else
        {
            EffectDep.pausedQueueEffects.add(this);
        }

        ComputedDep.endBatch();
    }
    private static pausedQueueEffects = new WeakSet<EffectDep>()

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
 * 副作用。
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
