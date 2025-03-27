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
 * 注：与 @vue/reactivity 中的 effect 不同，此函数返回的是一个 Effect 对象，而不是一个函数。不希望用户直接执行，而是通过反应式自动触发。
 */
export function effect<T = any>(fn: () => T): Effect
{
    return new EffectDep(fn);
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
    isEnable: boolean = true;

    constructor(func: (oldValue?: T) => T)
    {
        super(func);
        this.run();
    }

    pause()
    {
        this.isEnable = false;
    }

    resume()
    {
        this.isEnable = true;
    }

    trigger(dep?: Dep)
    {
        EffectDep.startBatch();

        super.trigger(dep);

        if (this.isEnable)
        {
            // 合批时需要判断是否已经运行的依赖。
            EffectDep.batch(this, Dep.activeReactivity === this)
        }

        EffectDep.endBatch();
    }

    static startBatch(): void
    {
        this._batchDepth++
    }

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
                __DEV__ && console.assert(dep._needRun === false, 'dep.dirty === false');
                let invalidChildNode = dep._invalidChildrenHead;
                while (invalidChildNode)
                {
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

                dep.run()

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
