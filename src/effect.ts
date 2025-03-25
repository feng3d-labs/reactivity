import { computed } from "./computed";
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
    const dep = computed(fn) as Dep;

    // 立即执行一次，以确保副作用函数被执行。
    dep.track();
    dep.onInvalidate = () => dep.track();

    return {
        pause: () => { dep.onInvalidate = undefined },
        resume: () =>
        {
            dep.onInvalidate = () => dep.track();
        }
    };
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