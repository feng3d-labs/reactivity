import { describe, expect, test } from 'vitest';
import { computed, effect, isProxy, isReactive, isRef, reactive, ref, toRaw } from '../src';

describe('reactivity/reactive', () =>
{
    test('Object', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);

        expect(observed).not.toBe(original);
        expect(isReactive(observed)).toBe(true);
        expect(isReactive(original)).toBe(false);
        // get
        expect(observed.foo).toBe(1);
        // has
        expect('foo' in observed).toBe(true);
        // ownKeys
        expect(Object.keys(observed)).toEqual(['foo']);
    });

    test('proto', () =>
    {
        const obj = {};
        const reactiveObj = reactive(obj);

        expect(isReactive(reactiveObj)).toBe(true);
        // read prop of reactiveObject will cause reactiveObj[prop] to be reactive
        const prototype = reactiveObj['__proto__'];
        const otherObj = { data: ['a'] };

        expect(isReactive(otherObj)).toBe(false);
        const reactiveOther = reactive(otherObj);

        expect(isReactive(reactiveOther)).toBe(true);
        expect(reactiveOther.data[0]).toBe('a');
    });

    test('nested reactives', () =>
    {
        const original = {
            nested: {
                foo: 1,
            },
            array: [{ bar: 2 }],
        };
        const observed = reactive(original);

        expect(isReactive(observed.nested)).toBe(true);
        expect(isReactive(observed.array)).toBe(true);
        expect(isReactive(observed.array[0])).toBe(true);
    });

    test('observing subtypes of IterableCollections(Map, Set)', () =>
    {
    // subtypes of Map
        class CustomMap extends Map
        { }
        const cmap = reactive(new CustomMap());

        expect(cmap).toBeInstanceOf(Map);
        expect(isReactive(cmap)).toBe(true);

        cmap.set('key', {});
        expect(isReactive(cmap.get('key'))).toBe(true);

        // subtypes of Set
        class CustomSet extends Set
        { }
        const cset = reactive(new CustomSet());

        expect(cset).toBeInstanceOf(Set);
        expect(isReactive(cset)).toBe(true);

        let dummy;

        effect(() => (dummy = cset.has('value')));
        expect(dummy).toBe(false);
        cset.add('value');
        expect(dummy).toBe(true);
        cset.delete('value');
        expect(dummy).toBe(false);
    });

    test('observing subtypes of WeakCollections(WeakMap, WeakSet)', () =>
    {
    // subtypes of WeakMap
        class CustomMap extends WeakMap
        { }
        const cmap = reactive(new CustomMap());

        expect(cmap).toBeInstanceOf(WeakMap);
        expect(isReactive(cmap)).toBe(true);

        const key = {};

        cmap.set(key, {});
        expect(isReactive(cmap.get(key))).toBe(true);

        // subtypes of WeakSet
        class CustomSet extends WeakSet
        { }
        const cset = reactive(new CustomSet());

        expect(cset).toBeInstanceOf(WeakSet);
        expect(isReactive(cset)).toBe(true);

        let dummy;

        effect(() => (dummy = cset.has(key)));
        expect(dummy).toBe(false);
        cset.add(key);
        expect(dummy).toBe(true);
        cset.delete(key);
        expect(dummy).toBe(false);
    });

    test('observed value should proxy mutations to original (Object)', () =>
    {
        const original: any = { foo: 1 };
        const observed = reactive(original);

        // set
        observed.bar = 1;
        expect(observed.bar).toBe(1);
        expect(original.bar).toBe(1);
        // delete
        delete observed.foo;
        expect('foo' in observed).toBe(false);
        expect('foo' in original).toBe(false);
    });

    test('original value change should reflect in observed value (Object)', () =>
    {
        const original: any = { foo: 1 };
        const observed = reactive(original);

        // set
        original.bar = 1;
        expect(original.bar).toBe(1);
        expect(observed.bar).toBe(1);
        // delete
        delete original.foo;
        expect('foo' in original).toBe(false);
        expect('foo' in observed).toBe(false);
    });

    test('setting a property with an unobserved value should wrap with reactive', () =>
    {
        const observed = reactive<{ foo?: object }>({});
        const raw = {};

        observed.foo = raw;
        expect(observed.foo).not.toBe(raw);
        expect(isReactive(observed.foo)).toBe(true);
    });

    test('observing already observed value should return same Proxy', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);
        const observed2 = reactive(observed);

        expect(observed2).toBe(observed);
    });

    test('observing the same value multiple times should return same Proxy', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);
        const observed2 = reactive(original);

        expect(observed2).toBe(observed);
    });

    test('observing the same value multiple times should return same Proxy', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);
        const observed2 = reactive(original);

        expect(observed2).toBe(observed);
    });

    test('should not pollute original object with Proxies', () =>
    {
        const original: any = { foo: 1 };
        const original2 = { bar: 2 };
        const observed = reactive(original);
        const observed2 = reactive(original2);

        observed.bar = observed2;
        expect(observed.bar).toBe(observed2);
        expect(original.bar).toBe(original2);
    });

    // #1246
    test('mutation on objects using reactive as prototype should not trigger', () =>
    {
        const observed = reactive({ foo: 1 });
        const original = Object.create(observed);
        let dummy;

        effect(() => (dummy = original.foo));
        expect(dummy).toBe(1);
        observed.foo = 2;
        expect(dummy).toBe(2);
        original.foo = 3;
        expect(dummy).toBe(2);
        original.foo = 4;
        expect(dummy).toBe(2);
    });

    test('toRaw', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);

        expect(toRaw(observed)).toBe(original);
        expect(toRaw(original)).toBe(original);
    });

    test('toRaw on object using reactive as prototype', () =>
    {
        const original = { foo: 1 };
        const observed = reactive(original);
        const inherted = Object.create(observed);

        expect(toRaw(inherted)).toBe(inherted);
    });

    test('toRaw on user Proxy wrapping reactive', () =>
    {
        const original = {};
        const re = reactive(original);
        const obj = new Proxy(re, {});
        const raw = toRaw(obj);

        expect(raw).toBe(original);
    });

    test('should not unwrap Ref<T>', () =>
    {
        const observedNumberRef = reactive(ref(1));
        const observedObjectRef = reactive(ref({ foo: 1 }));

        expect(isRef(observedNumberRef)).toBe(true);
        expect(isRef(observedObjectRef)).toBe(true);
    });

    test('should unwrap computed refs', () =>
    {
    // readonly
        const a = computed(() => 1);
        // writable
        const b = computed(() => 1);
        const obj = reactive({ a, b });

        // check type
        obj.a + 1;
        obj.b + 1;
        expect(typeof obj.a).toBe(`number`);
        expect(typeof obj.b).toBe(`number`);
    });

    test('should allow setting property from a ref to another ref', () =>
    {
        const foo = ref(0);
        const bar = ref(1);
        const observed = reactive({ a: foo });
        const dummy = computed(() => observed.a);

        expect(dummy.value).toBe(0);

        observed.a = bar;
        expect(dummy.value).toBe(1);

        bar.value++;
        expect(dummy.value).toBe(2);
    });

    test('should not observe non-extensible objects', () =>
    {
        const obj = reactive({
            foo: Object.preventExtensions({ a: 1 }),
            // sealed or frozen objects are considered non-extensible as well
            bar: Object.freeze({ a: 1 }),
            baz: Object.seal({ a: 1 }),
        });

        expect(isReactive(obj.foo)).toBe(false);
        expect(isReactive(obj.bar)).toBe(false);
        expect(isReactive(obj.baz)).toBe(false);
    });

    test('hasOwnProperty edge case: Symbol values', () =>
    {
        const key = Symbol();
        const obj = reactive({ [key]: 1 }) as { [key]?: 1 };
        let dummy;

        effect(() =>
        {
            dummy = obj.hasOwnProperty(key);
        });
        expect(dummy).toBe(true);

        delete obj[key];
        expect(dummy).toBe(false);
    });

    test('hasOwnProperty edge case: non-string values', () =>
    {
        const key = {};
        const obj = reactive({ '[object Object]': 1 }) as { '[object Object]'?: 1 };
        let dummy;

        effect(() =>
        {
            // @ts-expect-error
            dummy = obj.hasOwnProperty(key);
        });
        expect(dummy).toBe(true);

        // @ts-expect-error
        delete obj[key];
        expect(dummy).toBe(false);
    });

    test('isProxy', () =>
    {
        const foo = {};

        expect(isProxy(foo)).toBe(false);

        const fooRe = reactive(foo);

        expect(isProxy(fooRe)).toBe(true);

        const c = computed(() =>
        { });

        expect(isProxy(c)).toBe(false);
    });

    // #11696
    test('should use correct receiver on set handler for refs', () =>
    {
        const a = reactive(ref(1));

        effect(() => a.value);
        expect(() =>
        {
            a.value++;
        }).not.toThrow();
    });

    test('should trigger reactivity when Map key is undefined', () =>
    {
        const map = reactive(new Map());
        const c = computed(() => map.get(undefined));

        expect(c.value).toBe(undefined);

        map.set(undefined, 1);
        expect(c.value).toBe(1);
    });
});
