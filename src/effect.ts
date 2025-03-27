import { ComputedDep } from "./computed";

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
 * 副作用依赖。
 */
class EffectDep<T> extends ComputedDep<T> implements Effect
{
    /**
     * 是否为效果节点。
     */
    isEffect: boolean = true;

    constructor(func: (oldValue?: T) => T)
    {
        super(func);
        this.run();
    }

    pause()
    {
        this.isEffect = false;
    }

    resume()
    {
        this.isEffect = true;
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
