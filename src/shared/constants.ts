
/**
 * 响应式标志枚举，用于标识响应式对象的特殊属性或状态
 */
export enum ReactiveFlags
{
    IS_REACTIVE = '__v_isReactive', // 标识对象是否为响应式对象
    RAW = '__v_raw', // 获取对象的原始非响应式版本
    IS_REF = '__v_isRef', // 标识对象是否为 ref 对象
}

export enum TargetType
{
    INVALID = 0,
    COMMON = 1,
    COLLECTION = 2,
}

/**
 * 跟踪操作类型枚举，用于标识在响应式系统中对对象属性进行的操作类型
 */
export enum TrackOpTypes
{
    GET = 'get', // 获取属性值
    HAS = 'has', // 检查属性是否存在
}