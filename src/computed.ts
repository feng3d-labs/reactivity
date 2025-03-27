import { Dep } from "./dep";

/**
 * 创建计算反应式对象。
 * 
 * 首次获取值将会执行函数，后续获取值且在依赖发生变化的情况下将会重新计算。
 * 
 * @param func 检测的可能包含响应式的函数。
 * @returns 包含 value 属性的对象，用于获取计算结果。
 */
export function computed<T>(func: (oldValue?: T) => T): { readonly value: T }
{
    return new ComputedDep(func);
}

/**
 * 计算依赖。
 *
 * 当使用 computed 函数时，会创建一个 ComputedDep 对象。
 * 
 * 首次获取值将会执行函数，后续获取值且在依赖发生变化的情况下将会重新计算。
 */
export class ComputedDep<T = any> extends Dep<T>
{
    /**
     * 监听的函数。
     */
    private _func: (oldValue?: T) => T;

    /**
     * 是否脏，是否需要重新计算。
     */
    protected _needRun = true;

    constructor(func: (oldValue?: T) => T)
    {
        super();
        this._func = func;
    }

    /**
     * 执行当前节点。
     */
    run()
    {
        // 检查是否存在失效子节点。
        this._needRun = this._needRun || this.isChildrenChanged();

        // 标记为脏的情况下，执行计算。
        if (this._needRun)
        {
            // 立即去除脏标记，避免循环多重计算。
            this._needRun = false;

            // 保存当前节点作为父节点。
            const parentReactiveNode = Dep.activeReactivity;
            // 设置当前节点为活跃节点。
            Dep.activeReactivity = this as any;

            this._value = this._func(this._value);

            // 执行完毕后恢复父节点。
            Dep.activeReactivity = parentReactiveNode;
        }
    }
}
