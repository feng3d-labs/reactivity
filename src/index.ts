/**
 * 创建响应式值的引用。
 *
 * @param value 
 * @returns 
 */
export function ref<T>(value: T): { value: T }
{
    return new ValueReactiveNode<T>(value);
}

/**
 * 创建计算属性的函数
 * 计算属性的值会根据其依赖的响应式数据自动更新
 * @param func 计算属性的 getter 函数
 * @returns 包含 value 属性的对象，用于获取计算属性的值
 */
export function computed<T>(func: () => T)
{
    return new FunctionReactiveNode(func);
}

/**
 * 当前正在执行的反应式节点。
 */
let activeReactiveNode: ReactiveNode;

type ReactiveNodeLink = { node: ReactiveNode, value: any, next: ReactiveNodeLink };

/**
 * 反应式节点。
 */
class ReactiveNode<T = any>
{
    /**
     * 父反应节点。
     * 
     * 记录了哪些节点调用了当前节点。
     */
    parents = new Set<ReactiveNode>();

    /**
     * 是否脏，是否需要重新计算。
     */
    dirty = true;

    /**
     * 失效的子节点，需要在执行时检查子节点值是否发生变化。
     */
    invalidChildren: ReactiveNodeLink;

    /**
     * 当前节点值。
     */
    get value()
    {
        this.run();
        return this._value;
    }
    protected _value: T;

    constructor()
    {
    }

    /**
     * 执行当前节点。
     */
    run()
    {
        const parentReactiveNode = activeReactiveNode;
        activeReactiveNode = this;

        let node = this.invalidChildren;
        while (node)
        {
            if (node.value !== node.node.value)
            {
                this.markDirty();
            }

            node = node.next;
        }
        this.invalidChildren = undefined as any;

        //
        // 保存当前节点作为父节点。
        // 设置当前节点为父节点。
        if (this.dirty)
        {
            this._value = this._runSelf();

            // 连接父节点和子节点。
            if (parentReactiveNode)
            {
                this.parents.add(parentReactiveNode);
            }
            //
            this.dirty = false;
        }

        // 执行完毕后恢复父节点。
        activeReactiveNode = parentReactiveNode;
    }

    /**
     * 标记为脏，触发更新。
     */
    markDirty()
    {
        if (this.dirty)
        {
            return;
        }
        this.dirty = true;

        this.invalidate();

        //
        this.parents.clear();
    }

    invalidate()
    {
        //
        if (this.parents.size > 0)
        {
            this.parents.forEach(parent =>
            {
                const node: ReactiveNodeLink = { node: this, value: this._value, next: parent.invalidChildren };
                parent.invalidChildren = node;
                parent.invalidate();
            });
        }
    }

    /**
     * 执行当前节点自身。
     */
    protected _runSelf(): T
    {
        return this._value;
    }
}

/**
 * 反应式函数节点。
 * 
 * 当使用 computed 函数时，会创建一个 ReactiveFunctionNode 对象。
 * 
 * 当获取value值时，会执行func函数，返回结果。
 */
class FunctionReactiveNode<T> extends ReactiveNode
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

/**
 * 属性值反应式节点。
 * 
 * 当使用 reactive 函数创建一个反应式对象后，访问该对象的属性时，会创建一个 ReactiveGetValueNode 对象。
 * 
 * 当设置反应式对象对应属性值时，会触发该节点。
 */
class ValueReactiveNode<V> extends ReactiveNode<V>
{
    get value()
    {
        this.run();
        return this._value;
    }
    set value(v: V)
    {
        if (this._value === v) return;
        this.markDirty();
        this._value = v;
    }

    constructor(value: V)
    {
        super();
        this._value = value;
    }
}

