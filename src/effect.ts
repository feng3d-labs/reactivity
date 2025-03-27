import { ComputedDep } from "./computed";
import { batch, endBatch, startBatch } from "./dep";

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
class EffectDep<T> extends ComputedDep<T> implements Effect
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
        startBatch();

        super.invalidate();

        if (this.isEnable)
        {
            // 合批时需要判断是否已经运行的依赖。
            batch(this, this.isActive())
        }

        endBatch();
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
