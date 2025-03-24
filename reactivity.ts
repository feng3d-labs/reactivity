// 存储依赖关系的 WeakMap
const targetMap = new WeakMap<object, Map<string | symbol, Set<() => void>>>();

// 用于跟踪当前正在运行的副作用函数
let activeEffect: (() => void) | null = null;

// 用于收集依赖
function track(target: object, key: string | symbol) {
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = new Set()));
        }
        dep.add(activeEffect);
    }
}

// 用于触发依赖
function trigger(target: object, key: string | symbol) {
    const depsMap = targetMap.get(target);
    if (depsMap) {
        const dep = depsMap.get(key);
        if (dep) {
            dep.forEach(effect => effect());
        }
    }
}

// 创建响应式对象
export function reactive<T extends object>(target: T): T {
    return new Proxy(target, {
        get(target, key) {
            track(target, key);
            return target[key as keyof T];
        },
        set(target, key, value) {
            target[key as keyof T] = value;
            trigger(target, key);
            return true;
        }
    });
}

// 创建副作用函数
export function effect(fn: () => void) {
    const effectFn = () => {
        activeEffect = effectFn;
        fn();
        activeEffect = null;
    };
    effectFn();
    return effectFn;
}

// 创建计算属性
export function computed<T>(getter: () => T) {
    let value: T;
    let dirty = true;

    const effectFn = effect(() => {
        dirty = true;
        value = getter();
    });

    return {
        get value() {
            if (dirty) {
                effectFn();
                dirty = false;
            }
            return value;
        }
    };
}
