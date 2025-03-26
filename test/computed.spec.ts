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
        a.value!.v = 2 // 触发 c 作为 d 的失效依赖
        a.value = null // 触发 b 作为 d 的失效依赖
        d.value // 按顺序先检查 c 再检查 b，所以 c 会被重新计算
        expect(cSpy).toHaveBeenCalledTimes(2) // d 中没有保留被依赖的原始顺序（为了性能少维护了chind deps），只会根据失效顺序来进行检查。

        // 注：@vue/reactivity 存在差异
        // @vue/reactivity 按照原有的依赖顺序进行检查
        // @feng3d/reactivity 按照依赖的失效顺序进行检查
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

        expect(((a as any).parents as Set<any>).size === 3).toBe(true)
        expect(((a as any).parents as Set<any>).has(b)).toBe(true)
        expect(((a as any).parents as Set<any>).has(c)).toBe(true)
        expect(((a as any).parents as Set<any>).has(d)).toBe(true)
        expect(((b as any).parents as Set<any>).has(e)).toBe(true)
        expect(((c as any).parents as Set<any>).has(e)).toBe(true)
        expect(((d as any).parents as Set<any>).has(e)).toBe(true)

        expect(cSpy).toHaveBeenCalledTimes(2)

        a.value++
        e.value

        expect(cSpy).toHaveBeenCalledTimes(2)
    })

    it('should trigger by the second computed that maybe dirty', () =>
    {
        const cSpy = vi.fn()

        const src1 = ref(0)
        const src2 = ref(0)
        const c1 = computed(() => src1.value)
        const c2 = computed(() => (src1.value % 2) + src2.value)
        const c3 = computed(() =>
        {
            cSpy()
            c1.value
            c2.value
        })

        c3.value
        src1.value = 2
        c3.value
        expect(cSpy).toHaveBeenCalledTimes(2)
        src2.value = 1
        c3.value
        expect(cSpy).toHaveBeenCalledTimes(3)
    })

    it('should chained computeds dirtyLevel update with first computed effect', () =>
    {
        const v = ref(0)
        const c1 = computed(() =>
        {
            if (v.value === 0)
            {
                v.value = 1
            }
            return v.value
        })
        const c2 = computed(() => c1.value)
        const c3 = computed(() => c2.value)

        c3.value
    })

    it('should work when chained(ref+computed)', () =>
    {
        const v = ref(0)
        const c1 = computed(() =>
        {
            if (v.value === 0)
            {
                v.value = 1
            }
            return 'foo'
        })
        const c2 = computed(() => v.value + c1.value)
        expect(c2.value).toBe('0foo')
        expect(c2.value).toBe('1foo')
    })

    it('should be recomputed without being affected by side effects', () =>
    {
        const v = ref(0)
        const c1 = computed(() =>
        {
            v.value = 1
            return 0
        })
        const c2 = computed(() =>
        {
            return v.value + ',' + c1.value
        })

        expect(c2.value).toBe('0,0')
        v.value = 1
        expect(c2.value).toBe('1,0')
    })


    test('performance when removing dependencies from deeply nested computeds', () =>
    {
        const base = ref(1)
        const trigger = ref(true)
        const computeds: { value: any; }[] = []

        const LAYERS = 30

        for (let i = 0; i < LAYERS; i++)
        {
            const earlier = [...computeds]

            computeds.push(
                computed(() =>
                {
                    return base.value + earlier.reduce((sum, c) => sum + c.value, 0)
                }),
            )
        }

        const tail = computed(() =>
            trigger.value ? computeds[computeds.length - 1].value : 0,
        )

        const t0 = performance.now()
        expect(tail.value).toBe(2 ** (LAYERS - 1))
        const t1 = performance.now()
        expect(t1 - t0).toBeLessThan(process.env.CI ? 100 : 30)

        trigger.value = false
        expect(tail.value).toBe(0)
        const t2 = performance.now()
        expect(t2 - t1).toBeLessThan(process.env.CI ? 100 : 30)
    })

})