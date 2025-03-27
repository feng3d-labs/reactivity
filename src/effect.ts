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
    EffectDep.startBatch();
}

/**
 * 结束批次处理。
 */
export function endBatch()
{
    EffectDep.endBatch();
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
        this._isEnable = true;
    }

    trigger(dep?: Dep)
    {
        EffectDep.startBatch();

        super.trigger(dep);

        if (this._isEnable)
        {
            // 合批时需要判断是否已经运行的依赖。
            EffectDep.batch(this, Dep.activeReactivity === this)
        }

        EffectDep.endBatch();
    }

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

    /**
     * 开始批次处理。
     */
    static startBatch(): void
    {
        this._batchDepth++
    }

    /**
     * 结束批次处理。
     */
    static endBatch(): void
    {
        if (--this._batchDepth > 0)
        {
            return
        }

        // 处理已经运行过的依赖，
        if (this._isRunedDeps.length > 0)
        {
            this._isRunedDeps.forEach((dep) =>
            {
                // 此时依赖以及子依赖都已经运行过了，只需修复与子节点关系。
                __DEV__ && console.assert(dep._isDirty === false, 'dep.dirty === false');
                let invalidChildNode = dep._invalidChildrenHead;
                while (invalidChildNode)
                {
                    // 修复子节点与父节点的关系。
                    invalidChildNode.node._parents.add(dep);
                    invalidChildNode = invalidChildNode.next;
                }
                dep._invalidChildrenHead = undefined as any;
                dep._invalidChildrenTail = undefined as any;
            });
            this._isRunedDeps.length = 0;
        }

        // 批次处理
        if (this._needEffectDeps.length > 0)
        {
            this._needEffectDeps.forEach((dep) =>
            {
                // 独立执行回调
                const pre = Dep.activeReactivity;
                Dep.activeReactivity = null;

                dep.runIfDirty()

                Dep.activeReactivity = pre;
            });
            this._needEffectDeps.length = 0;
        }
    }

    /**
     * 合批处理。
     * 
     * @param dep 
     * @param isRunning 添加时是否是正在运行。 
     */
    static batch(dep: EffectDep, isRunning: boolean): void
    {
        if (isRunning)
        {
            this._isRunedDeps.push(dep);
        }
        else
        {
            this._needEffectDeps.push(dep);
        }
    }

    private static _batchDepth = 0
    /**
     * 正在运行的依赖。
     */
    private static _needEffectDeps: EffectDep[] = [];
    /**
     * 已经运行过的依赖，只需要修复与子节点关系。
     */
    private static _isRunedDeps: EffectDep[] = [];
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
