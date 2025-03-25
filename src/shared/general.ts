import { ReactiveFlags, TargetType } from "./constants";

export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object';
// 判断是否为数组
export const isArray: typeof Array.isArray = Array.isArray
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
export const isString = (val: unknown): val is string => typeof val === 'string'

export const isIntegerKey = (key: unknown): boolean =>
    isString(key) &&
    key !== 'NaN' &&
    key[0] !== '-' &&
    '' + parseInt(key as any, 10) === key

function targetTypeMap(rawType: string)
{
    switch (rawType)
    {
        case 'Object':
        case 'Array':
            return TargetType.COMMON
        case 'Map':
        case 'Set':
        case 'WeakMap':
        case 'WeakSet':
            return TargetType.COLLECTION
        default:
            return TargetType.INVALID
    }
}

export function getTargetType(value: Target)
{
    if (!Object.isExtensible(value)) return TargetType.INVALID;

    return targetTypeMap(toRawType(value));
}

const toTypeString = (value: unknown): string => Object.prototype.toString.call(value)

// 获取值的原始类型
const toRawType = (value: unknown): string =>
{
    // 从类似 "[object RawType]" 的字符串中提取 "RawType"
    return toTypeString(value).slice(8, -1)
}

export interface Target
{
    [ReactiveFlags.IS_REACTIVE]?: boolean
    [ReactiveFlags.RAW]?: any
}