import { describe, expect, it, test, vi } from 'vitest'
import { computed, effect, reactive, ref } from '../src'
describe('reactivity/effect', () =>
{
    it('should run the passed function once (wrapped by a effect)', () =>
    {
        const fnSpy = vi.fn(() => { })
        effect(fnSpy)
        expect(fnSpy).toHaveBeenCalledTimes(1)
    })

    it('should observe basic properties', () =>
    {
        let dummy
        const counter = reactive({ num: 0 })
        effect(() => (dummy = counter.num))

        expect(dummy).toBe(0)
        counter.num = 7
        expect(dummy).toBe(7)
    })

    it('should rerun the passed function when a trigger occurs', () =>
    {
        const a = ref(0)
        const b = ref(0)
        let result = 0;
        effect(() =>
        {
            result = a.value + b.value;
        })
        expect(result).toBe(a.value + b.value)
        a.value = Math.random();
        expect(result).toBe(a.value + b.value)
        b.value = Math.random();
        expect(result).toBe(a.value + b.value)
    })

})

