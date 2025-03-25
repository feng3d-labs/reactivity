import { describe, expect, it, test, vi } from 'vitest'
import { computed, effect, ref } from '../src'
describe('reactivity/effect', () =>
{
    it('should run the passed function once (wrapped by a effect)', () =>
    {
        const fnSpy = vi.fn(() => { })
        effect(fnSpy)
        expect(fnSpy).toHaveBeenCalledTimes(1)
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

