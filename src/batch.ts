import { ComputedReactivity } from './computed';
import { Reactivity } from './Reactivity';

/**
 * 合批处理。
 *
 * @param dep 要处理的依赖。
 * @param isRunning 添加时是否是正在运行。
 */
export function batch(dep: ComputedReactivity, isRunning: boolean): void
{
    if (isRunning)
    {
        _isRunedDeps.push(dep);
    }
    else
    {
        _needEffectDeps.push(dep);
    }
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
 * @param fn 要执行的函数，在此函数中多次修改反应式对象。
 */
export function batchRun<T>(fn: () => T): T
{
    _batchDepth++;

    const result = fn();

    if (--_batchDepth > 0)
    {
        return;
    }

    // 处理已经运行过的依赖，
    if (_isRunedDeps.length > 0)
    {
        _isRunedDeps.forEach((dep) =>
        {
            // 此时依赖以及子依赖都已经运行过了，只需修复与子节点关系。
            __DEV__ && console.assert(dep._isDirty === false, 'dep.dirty === false');

            let node = dep._childrenHead;
            while (node)
            {
                // 修复与子节点关系
                node.node._parents.set(dep, dep._version);
                //
                node = node.next;
            }
            dep._childrenHead = undefined;
            dep._childrenTail = undefined;
        });
        _isRunedDeps.length = 0;
    }

    // 批次处理
    if (_needEffectDeps.length > 0)
    {
        _needEffectDeps.forEach((dep) =>
        {
            // 独立执行回调
            const pre = Reactivity.activeReactivity;
            Reactivity.activeReactivity = null;

            dep.runIfDirty();

            Reactivity.activeReactivity = pre;
        });
        _needEffectDeps.length = 0;
    }

    return result;
}

let _batchDepth = 0;
/**
 * 正在运行的依赖。
 */
const _needEffectDeps: ComputedReactivity[] = [];
/**
 * 已经运行过的依赖，只需要修复与子节点关系。
 */
const _isRunedDeps: ComputedReactivity[] = [];
