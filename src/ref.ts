import { endBatch, startBatch } from "./batch";
import { Dep } from "./dep";
import { toReactive } from "./reactive";
import { ReactiveFlags } from "./shared/constants";
import { hasChanged, toRaw } from "./shared/general";

/**
 * 创建一个引用，该引用的值可以被响应式系统追踪和更新。
 *
 * @param value 引用的值。
 * @returns 包含 value 属性的对象，用于获取和设置引用的值。
 */
export function ref<T>(value?: T): Ref<T>
{
    if (isRef(value))
    {
        return value as any;
    }

    return new RefReactivity<T>(value) as any;
}

/**
 * 判断一个对象是否为引用。
 * @param r 引用。 
 */
export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>
export function isRef(r: any): r is Ref
{
    return r ? r[ReactiveFlags.IS_REF] === true : false
}

export interface RefReactivity<T = any> extends Ref<T> { }

/**
 * 引用反应式节点。
 * 
 * 当使用 ref 函数时，会创建一个 RefReactivity 对象。
 */
export class RefReactivity<T = any> extends Dep<T> implements Ref<T>
{
    public readonly [ReactiveFlags.IS_REF] = true

    get value()
    {
        this.track();

        return this._value;
    }

    set value(v: T)
    {
        const oldValue = this._rawValue;
        const newValue = toRaw(v)

        if (!hasChanged(oldValue, newValue)) return;

        startBatch();

        this.trigger();

        this._value = toReactive(newValue)
        this._rawValue = toRaw(newValue);

        endBatch();
    }

    /**
     * 原始值。
     * 
     * 用于比较值是否发生变化。
     */
    private _rawValue: T;

    constructor(value: T)
    {
        super();
        this._rawValue = toRaw(value);
        this._value = toReactive(value);
    }
}

export interface Ref<T = any, S = T>
{
    get value(): T
    set value(_: S)
    [RefSymbol]: true
}
declare const RefSymbol: unique symbol