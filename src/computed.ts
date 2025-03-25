import { Reactivity } from "./reactivity";

/**
 * 创建计算属性的函数
 * 计算属性的值会根据其依赖的响应式数据自动更新
 * @param func 计算属性的 getter 函数
 * @returns 包含 value 属性的对象，用于获取计算属性的值
 */
export function computed<T>(func: () => T): { value: T }
{
    return new FunctionReactiveNode(func);
}

/**
 * 反应式函数节点。
 *
 * 当使用 computed 函数时，会创建一个 ReactiveFunctionNode 对象。
 *
 * 当获取value值时，会执行func函数，返回结果。
 */
class FunctionReactiveNode<T> extends Reactivity
{
    /**
     * 监听的函数。
     */
    func: () => T;

    constructor(func: () => T)
    {
        super();
        this.func = func;
    }

    protected _runSelf()
    {
        return this.func();
    }
}
