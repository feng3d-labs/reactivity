import { describe, expect, it, test, vi } from 'vitest';
import { batchRun, Effect, effect, reactive, toRaw } from '../src';
import { EffectReactivity } from '../src/effect';

describe('reactivity/effect', () =>
{
    it('should run the passed function once (wrapped by a effect)', () =>
    {
        const fnSpy = vi.fn(() =>
        { });

        effect(fnSpy);
        expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should observe basic properties', () =>
    {
        let dummy;
        const counter = reactive({ num: 0 });

        effect(() => (dummy = counter.num));

        expect(dummy).toBe(0);
        counter.num = 7;
        expect(dummy).toBe(7);
    });

    it('should observe multiple properties', () =>
    {
        let dummy;
        const counter = reactive({ num1: 0, num2: 0 });

        effect(() => (dummy = counter.num1 + counter.num1 + counter.num2));

        expect(dummy).toBe(0);
        counter.num1 = counter.num2 = 7;
        expect(dummy).toBe(21);
    });

    it('should handle multiple effects', () =>
    {
        let dummy1; let
            dummy2;
        const counter = reactive({ num: 0 });

        effect(() => (dummy1 = counter.num));
        effect(() => (dummy2 = counter.num));

        expect(dummy1).toBe(0);
        expect(dummy2).toBe(0);
        counter.num++;
        expect(dummy1).toBe(1);
        expect(dummy2).toBe(1);
    });

    it('should observe nested properties', () =>
    {
        let dummy;
        const counter = reactive({ nested: { num: 0 } });

        effect(() => (dummy = counter.nested.num));

        expect(dummy).toBe(0);
        counter.nested.num = 8;
        expect(dummy).toBe(8);
    });

    it('should observe delete operations', () =>
    {
        let dummy;
        const obj = reactive<{
            prop?: string
        }>({ prop: 'value' });

        effect(() => (dummy = obj.prop));

        expect(dummy).toBe('value');
        delete obj.prop;
        expect(dummy).toBe(undefined);
    });

    it('should observe has operations', () =>
    {
        let dummy;
        const obj = reactive<{ prop?: string | number }>({ prop: 'value' });

        effect(() => (dummy = 'prop' in obj));

        expect(dummy).toBe(true);
        delete obj.prop;
        expect(dummy).toBe(false);
        obj.prop = 12;
        expect(dummy).toBe(true);
    });

    it('should observe properties on the prototype chain', () =>
    {
        let dummy;
        const counter = reactive<{ num?: number }>({ num: 0 });
        const parentCounter = reactive({ num: 2 });

        Object.setPrototypeOf(counter, parentCounter);
        effect(() => (dummy = counter.num));

        expect(dummy).toBe(0);
        delete counter.num;
        expect(dummy).toBe(2);
        parentCounter.num = 4;
        expect(dummy).toBe(4);
        counter.num = 3;
        expect(dummy).toBe(3);
    });

    it('should observe has operations on the prototype chain', () =>
    {
        let dummy;
        const counter = reactive<{ num?: number }>({ num: 0 });
        const parentCounter = reactive<{ num?: number }>({ num: 2 });

        Object.setPrototypeOf(counter, parentCounter);
        effect(() => (dummy = 'num' in counter));

        expect(dummy).toBe(true);
        delete counter.num;
        expect(dummy).toBe(true);
        delete parentCounter.num;
        expect(dummy).toBe(false);
        counter.num = 3;
        expect(dummy).toBe(true);
    });

    it('should observe inherited property accessors', () =>
    {
        let dummy; let parentDummy; let
            hiddenValue: any;
        const obj = reactive<{ prop?: number }>({});
        const parent = reactive({
            set prop(value)
            {
                hiddenValue = value;
            },
            get prop()
            {
                return hiddenValue;
            },
        });

        Object.setPrototypeOf(obj, parent);
        effect(() => (dummy = obj.prop));
        effect(() => (parentDummy = parent.prop));

        expect(dummy).toBe(undefined);
        expect(parentDummy).toBe(undefined);
        obj.prop = 4;
        expect(dummy).toBe(4);
        // this doesn't work, should it?
        // expect(parentDummy).toBe(4)
        parent.prop = 2;
        expect(dummy).toBe(2);
        expect(parentDummy).toBe(2);
    });

    it('should observe function call chains', () =>
    {
        let dummy;
        const counter = reactive({ num: 0 });

        effect(() => (dummy = getNum()));

        function getNum()
        {
            return counter.num;
        }

        expect(dummy).toBe(0);
        counter.num = 2;
        expect(dummy).toBe(2);
    });

    it('should observe iteration', () =>
    {
        let dummy;
        const list = reactive(['Hello']);

        effect(() => (dummy = list.join(' ')));

        expect(dummy).toBe('Hello');
        list.push('World!');
        expect(dummy).toBe('Hello World!');
        list.shift();
        expect(dummy).toBe('World!');
    });

    it('should observe implicit array length changes', () =>
    {
        let dummy;
        const list = reactive(['Hello']);

        effect(() => (dummy = list.join(' ')));

        expect(dummy).toBe('Hello');
        list[1] = 'World!';
        expect(dummy).toBe('Hello World!');
        list[3] = 'Hello!';
        expect(dummy).toBe('Hello World!  Hello!');
    });

    it('should observe sparse array mutations', () =>
    {
        let dummy;
        const list = reactive<string[]>([]);

        list[1] = 'World!';
        effect(() => (dummy = list.join(' ')));

        expect(dummy).toBe(' World!');
        list[0] = 'Hello';
        expect(dummy).toBe('Hello World!');
        list.pop();
        expect(dummy).toBe('Hello');
    });

    it('should observe enumeration', () =>
    {
        let dummy = 0;
        const numbers = reactive<Record<string, number>>({ num1: 3 });

        effect(() =>
        {
            dummy = 0;
            for (const key in numbers)
            {
                dummy += numbers[key];
            }
        });

        expect(dummy).toBe(3);
        numbers.num2 = 4;
        expect(dummy).toBe(7);
        delete numbers.num1;
        expect(dummy).toBe(4);
    });
    it('should observe symbol keyed properties', () =>
    {
        const key = Symbol('symbol keyed prop');
        let dummy; let
            hasDummy;
        const obj = reactive<{ [key]?: string }>({ [key]: 'value' });

        effect(() => (dummy = obj[key]));
        effect(() => (hasDummy = key in obj));

        expect(dummy).toBe('value');
        expect(hasDummy).toBe(true);
        obj[key] = 'newValue';
        expect(dummy).toBe('newValue');
        delete obj[key];
        expect(dummy).toBe(undefined);
        expect(hasDummy).toBe(false);
    });

    it('should not observe well-known symbol keyed properties', () =>
    {
        const key = Symbol.isConcatSpreadable;
        let dummy;
        const array: any = reactive([]);

        effect(() => (dummy = array[key]));

        expect(array[key]).toBe(undefined);
        expect(dummy).toBe(undefined);
        array[key] = true;
        expect(array[key]).toBe(true);
        expect(dummy).toBe(undefined);
    });

    it('should not observe well-known symbol keyed properties in has operation', () =>
    {
        const key = Symbol.isConcatSpreadable;
        const obj = reactive({
            [key]: true,
        }) as any;

        const spy = vi.fn(() =>
        {
            key in obj;
        });

        effect(spy);
        expect(spy).toHaveBeenCalledTimes(1);

        obj[key] = false;
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should support manipulating an array while observing symbol keyed properties', () =>
    {
        const key = Symbol();
        let dummy;
        const array: any = reactive([1, 2, 3]);

        effect(() => (dummy = array[key]));

        expect(dummy).toBe(undefined);
        array.pop();
        array.shift();
        array.splice(0, 1);
        expect(dummy).toBe(undefined);
        array[key] = 'value';
        array.length = 0;
        expect(dummy).toBe('value');
    });

    it('should observe function valued properties', () =>
    {
        const oldFunc = () =>
        { };
        const newFunc = () =>
        { };

        let dummy;
        const obj = reactive({ func: oldFunc });

        effect(() => (dummy = obj.func));

        expect(dummy).toBe(oldFunc);
        obj.func = newFunc;
        expect(dummy).toBe(newFunc);
    });

    it('should observe chained getters relying on this', () =>
    {
        const obj = reactive({
            a: 1,
            get b()
            {
                return this.a;
            },
        });

        let dummy;

        effect(() => (dummy = obj.b));
        expect(dummy).toBe(1);
        obj.a++;
        expect(dummy).toBe(2);
    });

    it('should observe methods relying on this', () =>
    {
        const obj = reactive({
            a: 1,
            b()
            {
                return this.a;
            },
        });

        let dummy;

        effect(() => (dummy = obj.b()));
        expect(dummy).toBe(1);
        obj.a++;
        expect(dummy).toBe(2);
    });

    it('should not observe set operations without a value change', () =>
    {
        let hasDummy; let
            getDummy;
        const obj = reactive({ prop: 'value' });

        const getSpy = vi.fn(() => (getDummy = obj.prop));
        const hasSpy = vi.fn(() => (hasDummy = 'prop' in obj));

        effect(getSpy);
        effect(hasSpy);

        expect(getDummy).toBe('value');
        expect(hasDummy).toBe(true);
        obj.prop = 'value';
        expect(getSpy).toHaveBeenCalledTimes(1);
        expect(hasSpy).toHaveBeenCalledTimes(1);
        expect(getDummy).toBe('value');
        expect(hasDummy).toBe(true);
    });

    it('should not observe raw mutations', () =>
    {
        let dummy;
        const obj = reactive<{ prop?: string }>({});

        effect(() => (dummy = toRaw(obj).prop));

        expect(dummy).toBe(undefined);
        obj.prop = 'value';
        expect(dummy).toBe(undefined);
    });

    it('should not be triggered by raw mutations', () =>
    {
        let dummy;
        const obj = reactive<{ prop?: string }>({});

        effect(() => (dummy = obj.prop));

        expect(dummy).toBe(undefined);
        toRaw(obj).prop = 'value';
        expect(dummy).toBe(undefined);
    });

    it('should not be triggered by inherited raw setters', () =>
    {
        let dummy; let parentDummy; let
            hiddenValue: any;
        const obj = reactive<{ prop?: number }>({});
        const parent = reactive({
            set prop(value)
            {
                hiddenValue = value;
            },
            get prop()
            {
                return hiddenValue;
            },
        });

        Object.setPrototypeOf(obj, parent);
        effect(() => (dummy = obj.prop));
        effect(() => (parentDummy = parent.prop));

        expect(dummy).toBe(undefined);
        expect(parentDummy).toBe(undefined);
        toRaw(obj).prop = 4;
        expect(dummy).toBe(undefined);
        expect(parentDummy).toBe(undefined);
    });

    it('should avoid implicit infinite recursive loops with itself', () =>
    {
        const counter = reactive({ num: 0 });

        const counterSpy = vi.fn(() => counter.num++);

        effect(counterSpy);
        expect(counter.num).toBe(1);
        expect(counterSpy).toHaveBeenCalledTimes(1);
        counter.num = 4;
        expect(counter.num).toBe(5);
        expect(counterSpy).toHaveBeenCalledTimes(2);
    });

    it('should avoid infinite recursive loops when use Array.prototype.push/unshift/pop/shift', () =>
    {
        (['push', 'unshift'] as const).forEach((key) =>
        {
            const arr = reactive<number[]>([]);
            const counterSpy1 = vi.fn(() => (arr[key] as any)(1));
            const counterSpy2 = vi.fn(() => (arr[key] as any)(2));

            effect(counterSpy1);
            effect(counterSpy2);
            expect(arr.length).toBe(2);
            expect(counterSpy1).toHaveBeenCalledTimes(1);
            expect(counterSpy2).toHaveBeenCalledTimes(1);
        });
        (['pop', 'shift'] as const).forEach((key) =>
        {
            const arr = reactive<number[]>([1, 2, 3, 4]);
            const counterSpy1 = vi.fn(() => (arr[key] as any)());
            const counterSpy2 = vi.fn(() => (arr[key] as any)());

            effect(counterSpy1);
            effect(counterSpy2);
            expect(arr.length).toBe(2);
            expect(counterSpy1).toHaveBeenCalledTimes(1);
            expect(counterSpy2).toHaveBeenCalledTimes(1);
        });
    });

    it('should allow explicitly recursive raw function loops', () =>
    {
        const counter = reactive({ num: 0 });
        const numSpy = vi.fn(() =>
        {
            counter.num++;
            if (counter.num < 10)
            {
                numSpy();
            }
        });

        effect(numSpy);
        expect(counter.num).toEqual(10);
        expect(numSpy).toHaveBeenCalledTimes(10);
    });

    it('should avoid infinite loops with other effects', () =>
    {
        const nums = reactive({ num1: 0, num2: 1 });

        const spy1 = vi.fn(() => (nums.num1 = nums.num2));
        const spy2 = vi.fn(() => (nums.num2 = nums.num1));

        effect(spy1);
        effect(spy2);
        expect(nums.num1).toBe(1);
        expect(nums.num2).toBe(1);
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        nums.num2 = 4;
        expect(nums.num1).toBe(4);
        expect(nums.num2).toBe(4);
        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(2);
        nums.num1 = 10;
        expect(nums.num1).toBe(10);
        expect(nums.num2).toBe(10);
        expect(spy1).toHaveBeenCalledTimes(3);
        expect(spy2).toHaveBeenCalledTimes(3);
    });

    it('should return a new reactive version of the function', () =>
    {
        function greet()
        {
            return 'Hello World';
        }
        const effect1 = effect(greet);
        const effect2 = effect(greet); // 与 @vue/reactivity 不同，这里不会返回一个函数，而是返回一个 effect 实例。

        // expect(typeof effect1).toBe('function')
        // expect(typeof effect2).toBe('function')
        expect(effect1).not.toBe(greet);
        expect(effect1).not.toBe(effect2);
    });

    it('should discover new branches while running automatically', () =>
    {
        let dummy;
        const obj = reactive({ prop: 'value', run: false });

        const conditionalSpy = vi.fn(() =>
        {
            dummy = obj.run ? obj.prop : 'other';
        });

        effect(conditionalSpy);

        expect(dummy).toBe('other');
        expect(conditionalSpy).toHaveBeenCalledTimes(1);
        obj.prop = 'Hi';
        expect(dummy).toBe('other');
        expect(conditionalSpy).toHaveBeenCalledTimes(1);
        obj.run = true;
        expect(dummy).toBe('Hi');
        expect(conditionalSpy).toHaveBeenCalledTimes(2);
        obj.prop = 'World';
        expect(dummy).toBe('World');
        expect(conditionalSpy).toHaveBeenCalledTimes(3);
    });

    it('should not be triggered by mutating a property, which is used in an inactive branch', () =>
    {
        let dummy;
        const obj = reactive({ prop: 'value', run: true });

        const conditionalSpy = vi.fn(() =>
        {
            dummy = obj.run ? obj.prop : 'other';
        });

        effect(conditionalSpy);

        expect(dummy).toBe('value');
        expect(conditionalSpy).toHaveBeenCalledTimes(1);
        obj.run = false;
        expect(dummy).toBe('other');
        expect(conditionalSpy).toHaveBeenCalledTimes(2);
        obj.prop = 'value2';
        expect(dummy).toBe('other');
        expect(conditionalSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle deep effect recursion using cleanup fallback', () =>
    {
        const results = reactive([0]);
        const effects: { fx: Effect; index: number }[] = [];

        for (let i = 1; i < 40; i++)
        {
            ((index) =>
            {
                const fx = effect(() =>
                {
                    results[index] = results[index - 1] * 2;
                });

                effects.push({ fx, index });
            })(i);
        }

        expect(results[39]).toBe(0);
        results[0] = 1;
        expect(results[39]).toBe(Math.pow(2, 39));
    });

    it('should register deps independently during effect recursion', () =>
    {
        const input = reactive({ a: 1, b: 2, c: 0 });
        const output = reactive({ fx1: 0, fx2: 0 });

        const fx1Spy = vi.fn(() =>
        {
            let result = 0;

            if (input.c < 2) result += input.a;
            if (input.c > 1) result += input.b;
            output.fx1 = result;
        });

        const fx1 = effect(fx1Spy);

        const fx2Spy = vi.fn(() =>
        {
            let result = 0;

            if (input.c > 1) result += input.a;
            if (input.c < 3) result += input.b;
            output.fx2 = result + output.fx1;
        });

        const fx2 = effect(fx2Spy);

        expect(fx1).not.toBeNull();
        expect(fx2).not.toBeNull();

        expect(output.fx1).toBe(1);
        expect(output.fx2).toBe(2 + 1);
        expect(fx1Spy).toHaveBeenCalledTimes(1);
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.b = 3;
        expect(output.fx1).toBe(1);
        expect(output.fx2).toBe(3 + 1);
        expect(fx1Spy).toHaveBeenCalledTimes(0);
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.c = 1;
        expect(output.fx1).toBe(1);
        expect(output.fx2).toBe(3 + 1);
        expect(fx1Spy).toHaveBeenCalledTimes(1);
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.c = 2;
        expect(output.fx1).toBe(3);
        expect(output.fx2).toBe(1 + 3 + 3);
        expect(fx1Spy).toHaveBeenCalledTimes(1);

        // Invoked due to change of fx1.
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.c = 3;
        expect(output.fx1).toBe(3);
        expect(output.fx2).toBe(1 + 3);
        expect(fx1Spy).toHaveBeenCalledTimes(1);
        expect(fx2Spy).toHaveBeenCalledTimes(1);

        fx1Spy.mockClear();
        fx2Spy.mockClear();
        input.a = 10;
        expect(output.fx1).toBe(3);
        expect(output.fx2).toBe(10 + 3);
        expect(fx1Spy).toHaveBeenCalledTimes(0);
        expect(fx2Spy).toHaveBeenCalledTimes(1);
    });

    it('should not run multiple times for a single mutation', () =>
    {
        let dummy;
        const obj = reactive<Record<string, number>>({});
        const fnSpy = vi.fn(() =>
        {
            for (const key in obj)
            {
                dummy = obj[key];
            }
            dummy = obj.prop;
        });

        effect(fnSpy);

        expect(fnSpy).toHaveBeenCalledTimes(1);
        obj.prop = 16;
        expect(dummy).toBe(16);
        expect(fnSpy).toHaveBeenCalledTimes(2);
    });

    it('should allow nested effects', () =>
    {
        const nums = reactive({ num1: 0, num2: 1, num3: 2 });
        const dummy: any = {};

        const childSpy = vi.fn(() => (dummy.num1 = nums.num1));
        const childeffect = effect(childSpy) as EffectReactivity;
        const parentSpy = vi.fn(() =>
        {
            dummy.num2 = nums.num2;
            //   childeffect()
            childeffect.run(); // 使用 effect(func).run(true) 来代替 @vue/reactivity 中的 effect(func)() 。
            dummy.num3 = nums.num3;
        });

        effect(parentSpy);

        expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 });
        expect(parentSpy).toHaveBeenCalledTimes(1);
        expect(childSpy).toHaveBeenCalledTimes(2);
        // this should only call the childeffect
        nums.num1 = 4;
        expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 });
        expect(parentSpy).toHaveBeenCalledTimes(1);
        expect(childSpy).toHaveBeenCalledTimes(3);
        // this calls the parenteffect, which calls the childeffect once
        nums.num2 = 10;
        expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 });
        expect(parentSpy).toHaveBeenCalledTimes(2);
        expect(childSpy).toHaveBeenCalledTimes(4);
        // this calls the parenteffect, which calls the childeffect once
        nums.num3 = 7;
        expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 });
        expect(parentSpy).toHaveBeenCalledTimes(3);
        expect(childSpy).toHaveBeenCalledTimes(5);
    });

    it('should observe json methods', () =>
    {
        let dummy = <Record<string, number>>{};
        const obj = reactive<Record<string, number>>({});

        effect(() =>
        {
            dummy = JSON.parse(JSON.stringify(obj));
        });
        obj.a = 1;
        expect(dummy.a).toBe(1);
    });

    it('should observe class method invocations', () =>
    {
        class Model
        {
            count: number;
            constructor()
            {
                this.count = 0;
            }

            inc()
            {
                this.count++;
            }
        }
        const model = reactive(new Model());
        let dummy;

        effect(() =>
        {
            dummy = model.count;
        });
        expect(dummy).toBe(0);
        model.inc();
        expect(dummy).toBe(1);
    });

    it('stop', () =>
    {
        let dummy;
        const obj = reactive({ prop: 1 });
        const runner = effect(() =>
        {
            dummy = obj.prop;
        }) as EffectReactivity;

        obj.prop = 2;
        expect(dummy).toBe(2);
        // stop(runner)
        runner.pause(); // 使用 effect(func).pause() 代替 @vue/reactivity 中的 stop(effect(func)) 。
        obj.prop = 3;
        expect(dummy).toBe(2);

        // stopped effect should still be manually callable
        // runner()
        runner.run(); // 使用 effect(func).run() 代替 @vue/reactivity 中的 effect(func)() 。
        expect(dummy).toBe(3);
    });

    it('stop: a stopped effect is nested in a normal effect', () =>
    {
        let dummy;
        const obj = reactive({ prop: 1 });
        const runner = effect(() =>
        {
            dummy = obj.prop;
        }) as EffectReactivity;

        // stop(runner)
        runner.pause(); // 使用 effect(func).pause() 代替 @vue/reactivity 中的 stop(effect(func)) 。
        obj.prop = 2;
        expect(dummy).toBe(1);

        // observed value in inner stopped effect
        // will track outer effect as an dependency
        effect(() =>
        {
            // runner()
            runner.run(); // 使用 effect(func).run() 代替 @vue/reactivity 中的 effect(func)() 。
        });
        expect(dummy).toBe(2);

        // notify outer effect to run
        obj.prop = 3;
        expect(dummy).toBe(3);
    });

    it('should not be triggered when the value and the old value both are NaN', () =>
    {
        const obj = reactive({
            foo: NaN,
        });
        const fnSpy = vi.fn(() => obj.foo);

        effect(fnSpy);
        obj.foo = NaN;
        expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should trigger all effects when array length is set to 0', () =>
    {
        const observed: any = reactive([1]);
        let dummy; let
            record;

        effect(() =>
        {
            dummy = observed.length;
        });
        effect(() =>
        {
            record = observed[0];
        });
        expect(dummy).toBe(1);
        expect(record).toBe(1);

        observed[1] = 2;
        expect(observed[1]).toBe(2);

        observed.unshift(3);
        expect(dummy).toBe(3);
        expect(record).toBe(3);

        observed.length = 0;
        expect(dummy).toBe(0);
        expect(record).toBeUndefined();
    });

    it('should not be triggered when set with the same proxy', () =>
    {
        const obj = reactive({ foo: 1 });
        const observed: any = reactive({ obj });
        const fnSpy = vi.fn(() => observed.obj);

        effect(fnSpy);

        expect(fnSpy).toHaveBeenCalledTimes(1);
        observed.obj = obj;
        expect(fnSpy).toHaveBeenCalledTimes(1);

        const obj2 = reactive({ foo: 1 });
        const observed2: any = reactive({ obj2 });
        const fnSpy2 = vi.fn(() => observed2.obj2);

        effect(fnSpy2);

        expect(fnSpy2).toHaveBeenCalledTimes(1);
        observed2.obj2 = obj2;
        expect(fnSpy2).toHaveBeenCalledTimes(1);
    });

    it('should be triggered when set length with string', () =>
    {
        let ret1 = 'idle';
        let ret2 = 'idle';
        const arr1 = reactive(new Array(11).fill(0));
        const arr2 = reactive(new Array(11).fill(0));

        effect(() =>
        {
            ret1 = arr1[10] === undefined ? 'arr[10] is set to empty' : 'idle';
        });
        effect(() =>
        {
            ret2 = arr2[10] === undefined ? 'arr[10] is set to empty' : 'idle';
        });
        arr1.length = 2;
        arr2.length = '2' as any;
        expect(ret1).toBe(ret2);
    });

    test('should track hasOwnProperty', () =>
    {
        const obj: any = reactive({});
        let has = false;
        const fnSpy = vi.fn();

        effect(() =>
        {
            fnSpy();
            has = obj.hasOwnProperty('foo');
        });
        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(has).toBe(false);

        obj.foo = 1;
        expect(fnSpy).toHaveBeenCalledTimes(2);
        expect(has).toBe(true);

        delete obj.foo;
        expect(fnSpy).toHaveBeenCalledTimes(3);
        expect(has).toBe(false);

        // should not trigger on unrelated key
        obj.bar = 2;
        expect(fnSpy).toHaveBeenCalledTimes(3);
        expect(has).toBe(false);
    });

    it('should be triggered once with batching', () =>
    {
        const counter = reactive({ num: 0 });

        const counterSpy = vi.fn(() => counter.num);

        effect(counterSpy);

        counterSpy.mockClear();

        batchRun(() =>
        {
            counter.num++;
            counter.num++;
        });

        expect(counterSpy).toHaveBeenCalledTimes(1);
    });

    test('should pause/resume effect', () =>
    {
        const obj = reactive({ foo: 1 });
        const fnSpy = vi.fn(() => obj.foo);
        const runner = effect(fnSpy);

        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(1);

        runner.pause();
        obj.foo++;
        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(2);

        runner.resume();
        expect(fnSpy).toHaveBeenCalledTimes(2);
        expect(obj.foo).toBe(2);

        obj.foo++;
        expect(fnSpy).toHaveBeenCalledTimes(3);
        expect(obj.foo).toBe(3);
    });

    test('should be executed once immediately when resume is called', () =>
    {
        const obj = reactive({ foo: 1 });
        const fnSpy = vi.fn(() => obj.foo);
        const runner = effect(fnSpy);

        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(1);

        runner.pause();
        obj.foo++;
        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(2);

        obj.foo++;
        expect(fnSpy).toHaveBeenCalledTimes(1);
        expect(obj.foo).toBe(3);

        runner.resume();
        expect(fnSpy).toHaveBeenCalledTimes(2);
        expect(obj.foo).toBe(3);
    });
});

