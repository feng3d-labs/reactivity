import { ComputedReactivity } from './computed';
import { EffectReactivity } from './effect';
import { Reactivity } from './Reactivity';
import { isComputedReactivity } from './util';

/**
 * 性能优化尝试记录：
 *
 * 1. 链表+位掩码优化（已回滚）：
 *    - 使用链表替代 Array，实现 O(1) 插入
 *    - 使用位掩码 (NOTIFIED flag) 实现 O(1) 去重
 *    - 结果：性能无明显提升（约 3.5x 差距保持不变）
 *    - 原因：队列规模较小（通常 <100），indexOf() 的 O(n) 开销可忽略；瓶颈在其他地方
 *
 * 2. for...of 替代 forEach（已回滚）：
 *    - 用 for...of 循环替代 Map.forEach/Array.forEach
 *    - 结果：性能无明显提升，甚至在某些情况下更差
 *    - 原因：V8 对 forEach 已高度优化，手动循环无优势
 *
 * 3. 当前保留的有效优化：
 *    - getBatchDepth() 检查，避免创建嵌套批次
 *    - effect.ts 中的快速路径优化
 */

/**
 * 批次深度。
 *
 * 用于跟踪嵌套的批次执行。
 * 当深度大于 0 时，表示当前正在批次执行中。
 */
let _batchDepth = 0;

/**
 * 获取当前批次深度。
 *
 * 用于优化：当已经在批次中时，避免创建嵌套批次。
 */
export function getBatchDepth(): number
{
    return _batchDepth;
}

/**
 * 待运行的效果队列。
 */
let _needEffectDeps: (ComputedReactivity | EffectReactivity)[] = [];

/**
 * 已运行的效果队列。
 */
let _isRunedDeps: ComputedReactivity[] = [];

/**
 * 合批处理依赖。
 *
 * 将依赖添加到待处理队列中，根据依赖的运行状态决定处理方式：
 * 1. 如果依赖正在运行，添加到已运行队列
 * 2. 如果依赖未运行，添加到待运行队列
 *
 * @param dep 要处理的依赖
 * @param isRunning 依赖是否正在运行
 */
export function batch(dep: ComputedReactivity | EffectReactivity, isRunning: boolean): void
{
    if (isRunning)
    {
        if (isComputedReactivity(dep))
        {
            // 如果依赖已经在队列中，直接返回，避免重复添加
            if (_isRunedDeps.indexOf(dep) !== -1)
            {
                return;
            }

            _isRunedDeps.push(dep);
        }
    }
    else
    {
        // 如果依赖已经在队列中，直接返回，避免重复添加
        if (_needEffectDeps.indexOf(dep) !== -1)
        {
            return;
        }

        _needEffectDeps.push(dep);
    }
}

/**
 * 批次执行多次修改反应式对象。
 *
 * 将多个响应式更新合并为一个批次执行，可以减少不必要的反应式触发。
 * 在批次执行期间：
 * 1. 所有响应式更新都会被收集
 * 2. 批次结束后统一处理所有更新
 * 3. 避免中间状态触发不必要的更新
 *
 * 示例：
 * ```ts
 * batchRun(() => {
 *     // 修改反应式对象
 *     reactiveObj.a = 1;
 *     reactiveObj.b = 2;
 * })
 * ```
 *
 * @param fn 要执行的函数，在此函数中多次修改反应式对象
 * @returns 函数的执行结果
 */
export function batchRun<T>(fn: () => T): T
{
    _batchDepth++;

    const result = fn();

    if (--_batchDepth > 0)
    {
        return result;
    }

    // 批次处理待运行的依赖
    if (_needEffectDeps.length > 0)
    {
        const subs = [..._needEffectDeps];

        _needEffectDeps = [];

        subs.forEach((dep) =>
        {
            // 独立执行回调，避免影响其他依赖
            const pre = Reactivity.activeReactivity;

            Reactivity.activeReactivity = undefined;

            dep.runIfDirty();

            Reactivity.activeReactivity = pre;
        });
    }

    // 处理已经运行过的依赖（computed）
    if (_isRunedDeps.length > 0)
    {
        _isRunedDeps.forEach((dep) =>
        {
            dep._fixChildren();
        });
        _isRunedDeps.length = 0;
    }

    return result;
}
