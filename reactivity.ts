// 存储依赖关系的 WeakMap，键为目标对象，值为一个 Map，
// 该 Map 的键为对象的属性名，值为一个 Set，存储依赖该属性的副作用函数
const targetMap = new WeakMap<object, Map<string | symbol, Set<() => void>>>();

// 用于跟踪当前正在运行的副作用函数
let activeEffect: (() => void) | null = null;

/**
 * 收集依赖的函数
 * 当访问响应式对象的属性时，会调用此函数将当前活动的副作用函数添加到该属性的依赖集合中
 * @param target 目标对象
 * @param key 访问的属性名
 */
function track(target: object, key: string | symbol) {
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            // 如果目标对象还没有对应的依赖映射，创建一个新的 Map
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            // 如果该属性还没有对应的依赖集合，创建一个新的 Set
            depsMap.set(key, (dep = new Set()));
        }
        // 将当前活动的副作用函数添加到该属性的依赖集合中
        dep.add(activeEffect);
    }
}

/**
 * 触发依赖的函数
 * 当设置响应式对象的属性时，会调用此函数执行依赖该属性的所有副作用函数
 * @param target 目标对象
 * @param key 设置的属性名
 */
function trigger(target: object, key: string | symbol) {
    const depsMap = targetMap.get(target);
    if (depsMap) {
        const dep = depsMap.get(key);
        if (dep) {
            // 遍历该属性的依赖集合，执行所有副作用函数
            dep.forEach(effect => effect());
        }
    }
}

/**
 * 创建响应式对象的函数
 * 使用 Proxy 代理目标对象，拦截属性的访问和设置操作，实现依赖收集和触发
 * @param target 要转换为响应式对象的目标对象
 * @returns 响应式对象
 */
export function reactive<T extends object>(target: T): T {
    return new Proxy(target, {
        get(target, key) {
            // 访问属性时，收集依赖
            track(target, key);
            return target[key as keyof T];
        },
        set(target, key, value) {
            // 设置属性时，更新属性值并触发依赖
            if (target[key as keyof T] !== value) {
                target[key as keyof T] = value;
                trigger(target, key);
            }
            return true;
        }
    });
}

/**
 * 创建副作用函数的函数
 * 执行传入的函数，并在执行过程中收集依赖
 * @param fn 要执行的副作用函数
 * @returns 包装后的副作用函数
 */
export function effect(fn: () => void) {
    const effectFn = () => {
        // 将当前副作用函数设为活动的副作用函数
        activeEffect = effectFn;
        fn();
        // 执行完函数后，将活动的副作用函数置为 null
        activeEffect = null;
    };
    // 立即执行副作用函数
    effectFn();
    return effectFn;
}

/**
 * 创建计算属性的函数
 * 计算属性的值会根据其依赖的响应式数据自动更新
 * @param getter 计算属性的 getter 函数
 * @returns 包含 value 属性的对象，用于获取计算属性的值
 */
export function computed<T>(getter: () => T) {
    let value: T;
    let dirty = true;

    const effectFn = effect(() => {
        // 标记为需要重新计算
        dirty = true;
        value = getter();
    });

    return {
        get value() {
            if (dirty) {
                // 如果需要重新计算，执行副作用函数
                effectFn();
                dirty = false;
            }
            return value;
        }
    };
}    