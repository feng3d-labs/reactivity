import { describe, expect, it, test, vi } from 'vitest'
import { computed, ref } from '../src'

describe('reactivity/computed', () =>
{

    it('computed', () =>
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

    // https://github.com/vuejs/core/pull/5912#issuecomment-1497596875
    it('should query deps dirty sequentially', () =>
    {
        const cSpy = vi.fn()

        const a = ref<null | { v: number }>({
            v: 1,
        })
        const b = computed(() =>
        {
            return a.value
        })
        const c = computed(() =>
        {
            cSpy()
            return b.value?.v
        })
        const d = computed(() =>
        {
            if (b.value)
            {
                return c.value
            }
            return 0
        })

        d.value
        a.value!.v = 2
        a.value = null
        d.value
        expect(cSpy).toHaveBeenCalledTimes(1)
    })

    it('chained computed dirty reallocation after trigger computed getter', () =>
    {
        let _msg: string | undefined

        const items = ref<number[]>()
        const isLoaded = computed(() =>
        {
            return !!items.value
        })
        const msg = computed(() =>
        {
            if (isLoaded.value)
            {
                return 'The items are loaded'
            } else
            {
                return 'The items are not loaded'
            }
        })

        _msg = msg.value
        items.value = [1, 2, 3]
        isLoaded.value // <- trigger computed getter
        _msg = msg.value
        items.value = undefined as any;
        _msg = msg.value

        expect(_msg).toBe('The items are not loaded')
    })


    // https://github.com/vuejs/core/pull/5912#issuecomment-1739159832
    it('deps order should be consistent with the last time get value', () =>
    {
        const cSpy = vi.fn()

        const a = ref(0)
        const b = computed(() =>
        {
            return a.value % 3 !== 0
        })
        const c = computed(() =>
        {
            cSpy()
            if (a.value % 3 === 2)
            {
                return 'expensive'
            }
            return 'cheap'
        })
        const d = computed(() =>
        {
            return a.value % 3 === 2
        })
        const e = computed(() =>
        {
            if (b.value)
            {
                if (d.value)
                {
                    return 'Avoiding expensive calculation'
                }
            }
            return c.value
        })

        e.value
        a.value++
        e.value

        // expect(e.deps!.dep).toBe(b.dep)
        // expect(e.deps!.nextDep!.dep).toBe(d.dep)
        // expect(e.deps!.nextDep!.nextDep!.dep).toBe(c.dep)
        expect(cSpy).toHaveBeenCalledTimes(2)

        a.value++
        e.value

        expect(cSpy).toHaveBeenCalledTimes(2)
    })
})