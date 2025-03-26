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

    it('should observe multiple properties', () =>
    {
        let dummy
        const counter = reactive({ num1: 0, num2: 0 })
        effect(() => (dummy = counter.num1 + counter.num1 + counter.num2))

        expect(dummy).toBe(0)
        counter.num1 = counter.num2 = 7
        expect(dummy).toBe(21)
    })

    it('should handle multiple effects', () =>
    {
        let dummy1, dummy2
        const counter = reactive({ num: 0 })
        effect(() => (dummy1 = counter.num))
        effect(() => (dummy2 = counter.num))

        expect(dummy1).toBe(0)
        expect(dummy2).toBe(0)
        counter.num++
        expect(dummy1).toBe(1)
        expect(dummy2).toBe(1)
    })

    it('should observe nested properties', () =>
    {
        let dummy
        const counter = reactive({ nested: { num: 0 } })
        effect(() => (dummy = counter.nested.num))

        expect(dummy).toBe(0)
        counter.nested.num = 8
        expect(dummy).toBe(8)
    })

    it('should observe delete operations', () =>
    {
        let dummy
        const obj = reactive<{
            prop?: string
        }>({ prop: 'value' })
        effect(() => (dummy = obj.prop))

        expect(dummy).toBe('value')
        delete obj.prop
        expect(dummy).toBe(undefined)
    })

    it('should observe has operations', () =>
    {
        let dummy
        const obj = reactive<{ prop?: string | number }>({ prop: 'value' })
        effect(() => (dummy = 'prop' in obj))

        expect(dummy).toBe(true)
        delete obj.prop
        expect(dummy).toBe(false)
        obj.prop = 12
        expect(dummy).toBe(true)
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

