import { ComputedDep } from "./computed";
import { Dep } from "./dep";

/**
 * 开始批次处理。
 */
export function startBatch(): void
{
    _batchDepth++
}

/**
 * 结束批次处理。
 */
export function endBatch(): void
{
    if (--_batchDepth > 0)
    {
        return
    }

    // 处理已经运行过的依赖，
    if (_isRunedDeps.length > 0)
    {
        _isRunedDeps.forEach((dep) =>
        {
            // 此时依赖以及子依赖都已经运行过了，只需修复与子节点关系。
            __DEV__ && console.assert(dep._isDirty === false, 'dep.dirty === false');

            dep._children.forEach((v, child) =>
            {
                if (child._parents.has(dep)) return;
                // 修复与子节点关系
                child._parents.add(dep);
            });
        });
        _isRunedDeps.length = 0;
    }

    // 批次处理
    if (_needEffectDeps.length > 0)
    {
        _needEffectDeps.forEach((dep) =>
        {
            // 独立执行回调
            const pre = Dep.activeReactivity;
            Dep.activeReactivity = null;

            dep.runIfDirty()

            Dep.activeReactivity = pre;
        });
        _needEffectDeps.length = 0;
    }
}

/**
 * 合批处理。
 * 
 * @param dep 
 * @param isRunning 添加时是否是正在运行。 
 */
export function batch(dep: ComputedDep, isRunning: boolean): void
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

let _batchDepth = 0
/**
 * 正在运行的依赖。
 */
let _needEffectDeps: ComputedDep[] = [];
/**
 * 已经运行过的依赖，只需要修复与子节点关系。
 */
let _isRunedDeps: ComputedDep[] = [];