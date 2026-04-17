import { ComputedReactivity } from './computed';
import { EffectReactivity } from './effect';
import { Reactivity } from './Reactivity';

export function needFix(dep: ComputedReactivity)
{
    // 如果依赖已经在队列中，直接返回，避免重复添加
    if (_isNeedFixComputed.indexOf(dep) !== -1)
    {
        return;
    }

    _isNeedFixComputed.push(dep);
}

/**
 * 合批处理依赖。
 *
 * @param dep 要处理的依赖
 */
export function batch(dep: EffectReactivity): void
{
    // 如果依赖已经在队列中，直接返回，避免重复添加
    if (_needEffectDeps.indexOf(dep) !== -1)
    {
        return;
    }

    _needEffectDeps.push(dep);
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
        return;
    }

    // 处理已经运行过的依赖
    _isNeedFixComputed.forEach((dep) =>
    {
        // 修复与子节点关系
        dep._fixChildren();
    });
    _isNeedFixComputed.length = 0;

    // 批次处理待运行的依赖
    _needEffectDeps.forEach((dep) =>
    {
        // 独立执行回调，避免影响其他依赖
        const pre = Reactivity.activeReactivity;

        Reactivity.activeReactivity = null;

        dep.runIfDirty();

        Reactivity.activeReactivity = pre;
    });
    _needEffectDeps.length = 0;

    return result;
}

/**
 * 批次深度。
 *
 * 用于跟踪嵌套的批次执行。
 * 当深度大于 0 时，表示当前正在批次执行中。
 */
let _batchDepth = 0;

/**
 * 待运行的依赖队列。
 *
 * 存储需要执行但尚未执行的依赖。
 * 在批次执行结束后，会统一处理这些依赖。
 */
const _needEffectDeps: EffectReactivity[] = [];

/**
 * 已运行的依赖队列。
 *
 * 存储已经执行过的依赖。
 * 这些依赖只需要修复与子节点的关系，不需要重新执行。
 */
const _isNeedFixComputed: ComputedReactivity[] = [];
