import { describe, expect, it, test, vi } from 'vitest'
import { computed, effect, reactive, ref } from '../src'
import { toRaw } from '../src/shared/general'
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

    it('should observe properties on the prototype chain', () =>
    {
        let dummy
        const counter = reactive<{ num?: number }>({ num: 0 })
        const parentCounter = reactive({ num: 2 })
        Object.setPrototypeOf(counter, parentCounter)
        effect(() => (dummy = counter.num))

        expect(dummy).toBe(0)
        delete counter.num
        expect(dummy).toBe(2)
        parentCounter.num = 4
        expect(dummy).toBe(4)
        counter.num = 3
        expect(dummy).toBe(3)
    })


    it('should observe has operations on the prototype chain', () =>
    {
        let dummy
        const counter = reactive<{ num?: number }>({ num: 0 })
        const parentCounter = reactive<{ num?: number }>({ num: 2 })
        Object.setPrototypeOf(counter, parentCounter)
        effect(() => (dummy = 'num' in counter))

        expect(dummy).toBe(true)
        delete counter.num
        expect(dummy).toBe(true)
        delete parentCounter.num
        expect(dummy).toBe(false)
        counter.num = 3
        expect(dummy).toBe(true)
    })


    it('should observe inherited property accessors', () =>
    {
        let dummy, parentDummy, hiddenValue: any
        const obj = reactive<{ prop?: number }>({})
        const parent = reactive({
            set prop(value)
            {
                hiddenValue = value
            },
            get prop()
            {
                return hiddenValue
            },
        })
        Object.setPrototypeOf(obj, parent)
        effect(() => (dummy = obj.prop))
        effect(() => (parentDummy = parent.prop))

        expect(dummy).toBe(undefined)
        expect(parentDummy).toBe(undefined)
        obj.prop = 4
        expect(dummy).toBe(4)
        // this doesn't work, should it?
        // expect(parentDummy).toBe(4)
        parent.prop = 2
        expect(dummy).toBe(2)
        expect(parentDummy).toBe(2)
    })

    it('should observe function call chains', () =>
    {
        let dummy
        const counter = reactive({ num: 0 })
        effect(() => (dummy = getNum()))

        function getNum()
        {
            return counter.num
        }

        expect(dummy).toBe(0)
        counter.num = 2
        expect(dummy).toBe(2)
    })

    it('should observe iteration', () =>
    {
        let dummy
        const list = reactive(['Hello'])
        effect(() => (dummy = list.join(' ')))

        expect(dummy).toBe('Hello')
        list.push('World!')
        expect(dummy).toBe('Hello World!')
        list.shift()
        expect(dummy).toBe('World!')
    })

    it('should observe implicit array length changes', () =>
    {
        let dummy
        const list = reactive(['Hello'])
        effect(() => (dummy = list.join(' ')))

        expect(dummy).toBe('Hello')
        list[1] = 'World!'
        expect(dummy).toBe('Hello World!')
        list[3] = 'Hello!'
        expect(dummy).toBe('Hello World!  Hello!')
    })

    it('should observe sparse array mutations', () =>
    {
        let dummy
        const list = reactive<string[]>([])
        list[1] = 'World!'
        effect(() => (dummy = list.join(' ')))

        expect(dummy).toBe(' World!')
        list[0] = 'Hello'
        expect(dummy).toBe('Hello World!')
        list.pop()
        expect(dummy).toBe('Hello')
    })

    it('should observe enumeration', () =>
    {
        let dummy = 0
        const numbers = reactive<Record<string, number>>({ num1: 3 })
        effect(() =>
        {
            dummy = 0
            for (let key in numbers)
            {
                dummy += numbers[key]
            }
        })

        expect(dummy).toBe(3)
        numbers.num2 = 4
        expect(dummy).toBe(7)
        delete numbers.num1
        expect(dummy).toBe(4)
    })
    it('should observe symbol keyed properties', () =>
    {
        const key = Symbol('symbol keyed prop')
        let dummy, hasDummy
        const obj = reactive<{ [key]?: string }>({ [key]: 'value' })
        effect(() => (dummy = obj[key]))
        effect(() => (hasDummy = key in obj))

        expect(dummy).toBe('value')
        expect(hasDummy).toBe(true)
        obj[key] = 'newValue'
        expect(dummy).toBe('newValue')
        delete obj[key]
        expect(dummy).toBe(undefined)
        expect(hasDummy).toBe(false)
    })

    it('should not observe well-known symbol keyed properties', () =>
    {
        const key = Symbol.isConcatSpreadable
        let dummy
        const array: any = reactive([])
        effect(() => (dummy = array[key]))

        expect(array[key]).toBe(undefined)
        expect(dummy).toBe(undefined)
        array[key] = true
        expect(array[key]).toBe(true)
        expect(dummy).toBe(undefined)
    })

    it('should not observe well-known symbol keyed properties in has operation', () =>
    {
        const key = Symbol.isConcatSpreadable
        const obj = reactive({
            [key]: true,
        }) as any

        const spy = vi.fn(() =>
        {
            key in obj
        })
        effect(spy)
        expect(spy).toHaveBeenCalledTimes(1)

        obj[key] = false
        expect(spy).toHaveBeenCalledTimes(1)
    })


    it('should support manipulating an array while observing symbol keyed properties', () =>
    {
        const key = Symbol()
        let dummy
        const array: any = reactive([1, 2, 3])
        effect(() => (dummy = array[key]))

        expect(dummy).toBe(undefined)
        array.pop()
        array.shift()
        array.splice(0, 1)
        expect(dummy).toBe(undefined)
        array[key] = 'value'
        array.length = 0
        expect(dummy).toBe('value')
    })


    it('should observe function valued properties', () =>
    {
        const oldFunc = () => { }
        const newFunc = () => { }

        let dummy
        const obj = reactive({ func: oldFunc })
        effect(() => (dummy = obj.func))

        expect(dummy).toBe(oldFunc)
        obj.func = newFunc
        expect(dummy).toBe(newFunc)
    })

    it('should observe chained getters relying on this', () =>
    {
        const obj = reactive({
            a: 1,
            get b()
            {
                return this.a
            },
        })

        let dummy
        effect(() => (dummy = obj.b))
        expect(dummy).toBe(1)
        obj.a++
        expect(dummy).toBe(2)
    })


    it('should observe methods relying on this', () =>
    {
        const obj = reactive({
            a: 1,
            b()
            {
                return this.a
            },
        })

        let dummy
        effect(() => (dummy = obj.b()))
        expect(dummy).toBe(1)
        obj.a++
        expect(dummy).toBe(2)
    })

    it('should not observe set operations without a value change', () =>
    {
        let hasDummy, getDummy
        const obj = reactive({ prop: 'value' })

        const getSpy = vi.fn(() => (getDummy = obj.prop))
        const hasSpy = vi.fn(() => (hasDummy = 'prop' in obj))
        effect(getSpy)
        effect(hasSpy)

        expect(getDummy).toBe('value')
        expect(hasDummy).toBe(true)
        obj.prop = 'value'
        expect(getSpy).toHaveBeenCalledTimes(1)
        expect(hasSpy).toHaveBeenCalledTimes(1)
        expect(getDummy).toBe('value')
        expect(hasDummy).toBe(true)
    })

    it('should not observe raw mutations', () =>
    {
        let dummy
        const obj = reactive<{ prop?: string }>({})
        effect(() => (dummy = toRaw(obj).prop))

        expect(dummy).toBe(undefined)
        obj.prop = 'value'
        expect(dummy).toBe(undefined)
    })

    it('should not be triggered by raw mutations', () =>
    {
        let dummy
        const obj = reactive<{ prop?: string }>({})
        effect(() => (dummy = obj.prop))

        expect(dummy).toBe(undefined)
        toRaw(obj).prop = 'value'
        expect(dummy).toBe(undefined)
    })

    it('should not be triggered by inherited raw setters', () =>
    {
        let dummy, parentDummy, hiddenValue: any
        const obj = reactive<{ prop?: number }>({})
        const parent = reactive({
            set prop(value)
            {
                hiddenValue = value
            },
            get prop()
            {
                return hiddenValue
            },
        })
        Object.setPrototypeOf(obj, parent)
        effect(() => (dummy = obj.prop))
        effect(() => (parentDummy = parent.prop))

        expect(dummy).toBe(undefined)
        expect(parentDummy).toBe(undefined)
        toRaw(obj).prop = 4
        expect(dummy).toBe(undefined)
        expect(parentDummy).toBe(undefined)
    })


    it('should avoid implicit infinite recursive loops with itself', () =>
    {
        const counter = reactive({ num: 0 })

        const counterSpy = vi.fn(() => counter.num++)
        effect(counterSpy)
        expect(counter.num).toBe(1)
        expect(counterSpy).toHaveBeenCalledTimes(1)
        counter.num = 4
        expect(counter.num).toBe(5)
        expect(counterSpy).toHaveBeenCalledTimes(2)
    })

    it('should avoid infinite recursive loops when use Array.prototype.push/unshift/pop/shift', () =>
    {
        (['push', 'unshift'] as const).forEach(key =>
        {
            const arr = reactive<number[]>([])
            const counterSpy1 = vi.fn(() => (arr[key] as any)(1))
            const counterSpy2 = vi.fn(() => (arr[key] as any)(2))
            effect(counterSpy1)
            effect(counterSpy2)
            expect(arr.length).toBe(2)
            expect(counterSpy1).toHaveBeenCalledTimes(1)
            expect(counterSpy2).toHaveBeenCalledTimes(1)
        });
        (['pop', 'shift'] as const).forEach(key =>
        {
            const arr = reactive<number[]>([1, 2, 3, 4])
            const counterSpy1 = vi.fn(() => (arr[key] as any)())
            const counterSpy2 = vi.fn(() => (arr[key] as any)())
            effect(counterSpy1)
            effect(counterSpy2)
            expect(arr.length).toBe(2)
            expect(counterSpy1).toHaveBeenCalledTimes(1)
            expect(counterSpy2).toHaveBeenCalledTimes(1)
        });
    })

    it('should allow explicitly recursive raw function loops', () =>
    {
        const counter = reactive({ num: 0 })
        const numSpy = vi.fn(() =>
        {
            counter.num++
            if (counter.num < 10)
            {
                numSpy()
            }
        })
        effect(numSpy)
        expect(counter.num).toEqual(10)
        expect(numSpy).toHaveBeenCalledTimes(10)
    })


    it('should avoid infinite loops with other effects', () =>
    {
        const nums = reactive({ num1: 0, num2: 1 })

        const spy1 = vi.fn(() => (nums.num1 = nums.num2))
        const spy2 = vi.fn(() => (nums.num2 = nums.num1))
        effect(spy1)
        effect(spy2)
        expect(nums.num1).toBe(1)
        expect(nums.num2).toBe(1)
        expect(spy1).toHaveBeenCalledTimes(1)
        expect(spy2).toHaveBeenCalledTimes(1)
        nums.num2 = 4
        expect(nums.num1).toBe(4)
        expect(nums.num2).toBe(4)
        expect(spy1).toHaveBeenCalledTimes(2)
        expect(spy2).toHaveBeenCalledTimes(2)
        nums.num1 = 10
        expect(nums.num1).toBe(10)
        expect(nums.num2).toBe(10)
        expect(spy1).toHaveBeenCalledTimes(3)
        expect(spy2).toHaveBeenCalledTimes(3)
    })

    it('should return a new reactive version of the function', () =>
    {
        function greet()
        {
            return 'Hello World'
        }
        const effect1 = effect(greet)
        const effect2 = effect(greet) // 与 @vue/reactivity 不同，这里不会返回一个函数，而是返回一个 effect 实例。
        // expect(typeof effect1).toBe('function')
        // expect(typeof effect2).toBe('function')
        expect(effect1).not.toBe(greet)
        expect(effect1).not.toBe(effect2)
    })

    it('should discover new branches while running automatically', () =>
    {
        let dummy
        const obj = reactive({ prop: 'value', run: false })

        const conditionalSpy = vi.fn(() =>
        {
            dummy = obj.run ? obj.prop : 'other'
        })
        effect(conditionalSpy)

        expect(dummy).toBe('other')
        expect(conditionalSpy).toHaveBeenCalledTimes(1)
        obj.prop = 'Hi'
        expect(dummy).toBe('other')
        expect(conditionalSpy).toHaveBeenCalledTimes(1)
        obj.run = true
        expect(dummy).toBe('Hi')
        expect(conditionalSpy).toHaveBeenCalledTimes(2)
        obj.prop = 'World'
        expect(dummy).toBe('World')
        expect(conditionalSpy).toHaveBeenCalledTimes(3)
    })

    it('should not be triggered by mutating a property, which is used in an inactive branch', () =>
    {
        let dummy
        const obj = reactive({ prop: 'value', run: true })

        const conditionalSpy = vi.fn(() =>
        {
            dummy = obj.run ? obj.prop : 'other'
        })
        const e = effect(conditionalSpy)

        expect(dummy).toBe('value')
        expect(conditionalSpy).toHaveBeenCalledTimes(1)
        obj.run = false
        expect(dummy).toBe('other')
        expect(conditionalSpy).toHaveBeenCalledTimes(2)
        obj.prop = 'value2'
        expect(dummy).toBe('other')
        expect(conditionalSpy).toHaveBeenCalledTimes(2)
    })

})

