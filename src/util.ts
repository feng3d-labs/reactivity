import { ComputedReactivity } from './computed';

/**
 * 判断是否为 ComputedReactivity 实例的类型守卫函数。
 *
 * @param o 待检查的对象
 * @returns 如果是 ComputedReactivity 实例返回 true，TypeScript 会将类型收窄为 ComputedReactivity
 */
export function isComputedReactivity(o: any): o is ComputedReactivity
{
    return o?.__v_isComputedReactivity === true;
}