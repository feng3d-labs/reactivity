import { EffectReactivity } from './effect';

/**
 * 当前正在运行的作用域
 */
let activeEffectScope: EffectScope | undefined;

/**
 * 获取当前正在运行的作用域
 */
export function getCurrentScope(): EffectScope | undefined {
    return activeEffectScope;
}

/**
 * 在作用域销毁时执行的回调函数
 */
export function onScopeDispose(fn: () => void): void {
    if (activeEffectScope) {
        activeEffectScope.onDispose(fn);
    }
}

/**
 * 作用域类
 */
export class EffectScope {
    /**
     * 是否已销毁
     */
    private _disposed = false;

    /**
     * 是否已暂停
     */
    private _isPaused = false;

    /**
     * 作用域内的所有响应式对象
     */
    private effects: EffectReactivity[] = [];

    /**
     * 作用域销毁时的回调函数
     */
    private disposeCallbacks: (() => void)[] = [];

    /**
     * 父作用域
     */
    private parent: EffectScope | undefined;

    /**
     * 构造函数
     * @param detached 是否独立作用域
     */
    constructor(detached = false) {
        if (!detached && activeEffectScope) {
            this.parent = activeEffectScope;
            activeEffectScope.effects.push(this as any);
        }
    }

    /**
     * 运行作用域
     * @param fn 要运行的函数
     */
    run<T>(fn: () => T): T | undefined {
        if (this._disposed) {
            return;
        }
        const prevEffectScope = activeEffectScope;
        activeEffectScope = this;
        try {
            return fn();
        } finally {
            activeEffectScope = prevEffectScope;
        }
    }

    /**
     * 停止作用域
     */
    stop(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.effects.forEach(effect => effect.stop());
        this.disposeCallbacks.forEach(cb => cb());
        this.effects = [];
        this.disposeCallbacks = [];
    }

    /**
     * 暂停作用域
     */
    pause(): void {
        if (this._disposed) {
            return;
        }
        this._isPaused = true;
        this.effects.forEach(effect => effect.pause());
    }

    /**
     * 恢复作用域
     */
    resume(): void {
        if (this._disposed || !this._isPaused) {
            return;
        }
        this._isPaused = false;
        this.effects.forEach(effect => effect.resume());
    }

    /**
     * 添加销毁回调
     */
    onDispose(fn: () => void): void {
        if (this._disposed) {
            fn();
            return;
        }
        this.disposeCallbacks.push(fn);
    }
}

/**
 * 创建作用域
 * @param detached 是否独立作用域
 */
export function effectScope(detached = false): EffectScope {
    return new EffectScope(detached);
}
