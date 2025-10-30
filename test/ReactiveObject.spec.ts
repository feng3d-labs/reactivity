import { Computed, computed, effect, reactive } from '@feng3d/reactivity';
import { assert, describe, it } from 'vitest';
import { ReactiveObject } from './ReactiveObject';

describe('ReactiveObject', () =>
{
    it('ReactiveObject 处理树形依赖问题，并且存在依赖时序问题', () =>
    {
        const object = { a: 1, b: 2, d: 0 };
        const r_object = reactive(object);

        let times = 0;

        effect(() =>
        {
            r_object.a;

            const testClass = TestClass.getInstance(object); // 放在 r_object.a 之后会出现时序问题

            reactive(testClass).c;
            testClass.c;

            r_object.d = testClass.c + object.a;

            times++;
        });

        assert.strictEqual(times, 1);
        assert.strictEqual(r_object.d, 4);

        times = 0;

        r_object.a++;
        assert.strictEqual(r_object.d, 6);
        assert.strictEqual(times, 2); // 存在时序问题，r_object.a触发执行一次，此时testClass.c还未计算。然后触发testClass.c的计算，testClass.c改变后再次触发执行一次

        times = 0;

        r_object.a++;

        assert.strictEqual(times, 2); // 存在时序问题，r_object.a触发执行一次，此时testClass.c还未计算。然后触发testClass.c的计算，testClass.c改变后再次触发执行一次
        assert.strictEqual(r_object.d, 8);
    });

    it('getInstance', () =>
    {
        const object = { a: 1, b: 2, c: 0, d: 0 };
        const r_object = reactive(object);

        let times = 0;

        effect(() =>
        {
            r_object.a;

            const c = getInstance(object); // 同样存在多重依赖，且存在时序问题，但使用 computed 缓存实例后不会重复执行该函数

            r_object.d = c + object.a;

            times++;
        });

        assert.strictEqual(times, 1);
        assert.strictEqual(r_object.d, 4);

        times = 0;

        r_object.a++;
        assert.strictEqual(r_object.d, 6);
        assert.strictEqual(times, 1);

        times = 0;

        r_object.a++;

        assert.strictEqual(times, 1);
        assert.strictEqual(r_object.d, 8);
    });
});

const map: { [key: string]: number } = {};

class TestClass extends ReactiveObject
{
    readonly c: number = 0;

    constructor(object: { a: number, b: number })
    {
        super();

        this._onCreate(object);
        this._onMap(object);
    }

    private _onCreate(object: { a: number, b: number })
    {
        const r_this = reactive(this);
        const r_object = reactive(object);

        this.effect(() =>
        {
            r_this.c = r_object.a + r_object.b;
        });
    }

    private _onMap(object: { a: number, b: number })
    {
        TestClass.cacheMap.set(object, this);
        this.destroyCall(() =>
        {
            TestClass.cacheMap.delete(object);
        });
    }

    static getInstance(object: { a: number, b: number })
    {
        return this.cacheMap.get(object) || new TestClass(object);
    }

    static cacheMap = new WeakMap<{ a: number, b: number }, TestClass>();
}

function getInstance(object: { a: number, b: number })
{
    let result = cacheMap.get(object);

    if (result) return result.value;

    result = computed(() =>
    {
        const r_object = reactive(object);

        return r_object.a + r_object.b;
    });

    cacheMap.set(object, result);

    return result.value;
}
const cacheMap = new WeakMap<{ a: number, b: number }, Computed<number>>();