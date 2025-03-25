import { Reactivity } from "./Reactivity";

/**
 * 创建计算反应式对象。
 * 
 * 首次获取值将会执行函数，后续获取值且在依赖发生变化的情况下将会重新计算。
 * 
 * @param func 检测的可能包含响应式的函数。
 * @returns 包含 value 属性的对象，用于获取计算结果。
 */
export function computed<T>(func: (oldValue?: T) => T): { value: T }
{
    return new ComputedReactivity(func);
}

/**
 * 计算反应式节点。
 *
 * 当使用 computed 函数时，会创建一个 ReactiveFunctionNode 对象。
 * 
 * 首次获取值将会执行函数，后续获取值且在依赖发生变化的情况下将会重新计算。
 */
class ComputedReactivity<T> extends Reactivity
{
    /**
     * 监听的函数。
     */
    func: (oldValue?: T) => T;

    constructor(func: (oldValue?: T) => T)
    {
        super();
        this.func = func;
    }

    protected _runSelf()
    {
        return this.func(this._value);
    }
}
