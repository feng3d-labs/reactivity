import { assert, describe, expect, it, vi } from 'vitest';
import { isReactive, reactive } from '@vue/reactivity';

describe('reactivity/collections', () => {

    function coverCollectionFn(collection: Map<any, any>, fnName: string) {
        const spy = vi.fn()
        let proxy = reactive(collection)
            ; (collection as any)[fnName] = spy
        return [proxy as any, spy]
    }
    describe('Map', () => {
        // 验证响应式Map的实例类型
        it('instanceof', () => {
            const original = new Map()
            const observed = reactive(original)
            expect(isReactive(observed)).toBe(true)
            expect(original).toBeInstanceOf(Map)
            expect(observed).toBeInstanceOf(Map)

            const observed1 = reactive(original)
            assert.equal(observed == observed1,true)
        })
    });
});