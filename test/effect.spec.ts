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

