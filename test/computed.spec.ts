import { describe, expect, it, test, vi } from 'vitest'
import { computed, effect, reactive, ref } from '../src'
import { RefReactivity } from '../src/ref'
import { ComputedDep } from '../src/computed'

describe('reactivity/computed', () =>
{
    it('should return updated value', () =>
    {
        const value = reactive<{ foo?: number }>({})
        const cValue = computed(() => value.foo)
        expect(cValue.value).toBe(undefined)
        value.foo = 1
        expect(cValue.value).toBe(1)
    })

    it('pass oldValue to computed getter', () =>
    {
        const count = ref(0)
        const oldValue = ref()
        const curValue = computed(pre =>
        {
            oldValue.value = pre
            return count.value
        })
        expect(curValue.value).toBe(0)
        expect(oldValue.value).toBe(undefined)
        count.value++
        expect(curValue.value).toBe(1)
        expect(oldValue.value).toBe(0)
    })

    it('should compute lazily', () =>
    {
        const value = reactive<{ foo?: number }>({})
        const getter = vi.fn(() => value.foo)
        const cValue = computed(getter)

        // lazy
        expect(getter).not.toHaveBeenCalled()

        expect(cValue.value).toBe(undefined)
        expect(getter).toHaveBeenCalledTimes(1)

        // should not compute again
        cValue.value
        expect(getter).toHaveBeenCalledTimes(1)

        // should not compute until needed
        value.foo = 1
        expect(getter).toHaveBeenCalledTimes(1)

        // now it should compute
        expect(cValue.value).toBe(1)
        expect(getter).toHaveBeenCalledTimes(2)

        // should not compute again
        cValue.value
        expect(getter).toHaveBeenCalledTimes(2)
    })


    it('should trigger effect', () =>
    {
        const value = reactive<{ foo?: number }>({})
        const cValue = computed(() => value.foo)
        let dummy
        effect(() =>
        {
            dummy = cValue.value
        })
        expect(dummy).toBe(undefined)
        value.foo = 1
        expect(dummy).toBe(1)
    })

    it('should work when chained', () =>
    {
        const value = reactive({ foo: 0 })
        const c1 = computed(() => value.foo)
        const c2 = computed(() => c1.value + 1)
        expect(c2.value).toBe(1)
        expect(c1.value).toBe(0)
        value.foo++
        expect(c2.value).toBe(2)
        expect(c1.value).toBe(1)
    })

    it('should trigger effect when chained', () =>
    {
        const value = reactive({ foo: 0 })
        const getter1 = vi.fn(() => value.foo)
        const getter2 = vi.fn(() =>
        {
            return c1.value + 1
        })
        const c1 = computed(getter1)
        const c2 = computed(getter2)

        let dummy
        effect(() =>
        {
            dummy = c2.value
        })
        expect(dummy).toBe(1)
        expect(getter1).toHaveBeenCalledTimes(1)
        expect(getter2).toHaveBeenCalledTimes(1)
        value.foo++
        expect(dummy).toBe(2)
        // should not result in duplicate calls
        expect(getter1).toHaveBeenCalledTimes(2)
        expect(getter2).toHaveBeenCalledTimes(2)
    })

    it('should trigger effect when chained (mixed invocations)', () =>
    {
        const value = reactive({ foo: 0 })
        const getter1 = vi.fn(() => value.foo)
        const getter2 = vi.fn(() =>
        {
            return c1.value + 1
        })
        const c1 = computed(getter1)
        const c2 = computed(getter2)

        let dummy
        effect(() =>
        {
            dummy = c1.value + c2.value
        })
        expect(dummy).toBe(1)

        expect(getter1).toHaveBeenCalledTimes(1)
        expect(getter2).toHaveBeenCalledTimes(1)
        value.foo++
        expect(dummy).toBe(3)
        // should not result in duplicate calls
        expect(getter1).toHaveBeenCalledTimes(2)
        expect(getter2).toHaveBeenCalledTimes(2)
    })

    // #5720
    it('should invalidate before non-computed effects', () =>
    {
        let plusOneValues: number[] = []
        const n = ref(0)
        const plusOne = computed(() => n.value + 1)
        effect(() =>
        {
            n.value
            plusOneValues.push(plusOne.value)
        })
        // access plusOne, causing it to be non-dirty
        plusOne.value
        // mutate n
        n.value++
        // on the 2nd run, plusOne.value should have already updated.
        expect(plusOneValues).toMatchObject([1, 2])
    })

})