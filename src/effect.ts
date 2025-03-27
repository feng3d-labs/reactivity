import { ComputedDep } from "./computed";
import { Dep } from "./dep";

/**
 * 创建副作用。
 * 
 * 被作用的函数所引用的响应式对象发生变化时，会立即执行 fn 函数。
 * 
 * @param fn 要执行的函数
 * @returns  暂停和恢复副作用的函数
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

    invalidate()
    {
        EffectDep.startBatch();

        super.invalidate();

        if (this.isEnable)
        {
            // 合批时需要判断是否已经运行的依赖。
            EffectDep. batch(this, Dep.activeReactivity === this)
        }

        EffectDep.endBatch();
    }


    static startBatch(): void
    {
        this.batchDepth++
    }
    
    static endBatch(): void
    {
        if (--this.batchDepth > 0)
        {
            return
        }
    
        // 处理已经运行过的依赖，
        if (this.isRunningDeps.length > 0)
        {
            this.isRunningDeps.forEach((dep) =>
            {
                // 此时依赖以及子依赖都已经运行过了，只需修复与子节点关系。
                __DEV__ && console.assert(dep.dirty === false, 'dep.dirty === false');
                let invalidChildNode = dep.invalidChildrenHead;
                while (invalidChildNode)
                {
                    invalidChildNode.node.parents.add(dep);
                    invalidChildNode = invalidChildNode.next;
                }
                dep.invalidChildrenHead = undefined as any;
                dep.invalidChildrenTail = undefined as any;
            });
            this.isRunningDeps.length = 0;
        }
    
        // 批次处理
        if (this.needEffectDeps.length > 0)
        {
            this. needEffectDeps.forEach((dep) =>
            {
                // 独立执行回调
                const pre = Dep.activeReactivity;
                Dep.activeReactivity = null;
    
                dep.run()
    
                Dep.activeReactivity = pre;
            });
            this. needEffectDeps.length = 0;
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
           this. isRunningDeps.push(dep);
        }
        else
        {
            this. needEffectDeps.push(dep);
        }
    }
    
    static batchDepth = 0
    /**
     * 正在运行的依赖。
     */
    static needEffectDeps: EffectDep[] = [];
    /**
     * 已经运行过的依赖，只需要修复与子节点关系。
     */
    static isRunningDeps: EffectDep[] = [];
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
