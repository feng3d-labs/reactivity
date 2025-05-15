import { describe, expect, it } from 'vitest';

import { effect, effectScope, getCurrentScope, onScopeDispose, ref } from '../src';

describe('effectScope', () =>
{
    it('should work', () =>
    {
        const counter = ref(1);
        let doubleValue: number;

        const scope = effectScope();
        scope.run(() =>
        {
            effect(() =>
            {
                doubleValue = counter.value * 2;
            });
        });

        expect(doubleValue!).toBe(2);
        counter.value++;
        expect(doubleValue!).toBe(4);

        scope.stop();
        counter.value++;
        expect(doubleValue!).toBe(4);
    });

    it('should collect nested effects', () =>
    {
        const counter = ref(1);
        let doubleValue: number;
        let tripleValue: number;

        const scope = effectScope();
        scope.run(() =>
        {
            effect(() =>
            {
                doubleValue = counter.value * 2;
            });

            effect(() =>
            {
                tripleValue = counter.value * 3;
            });
        });

        expect(doubleValue!).toBe(2);
        expect(tripleValue!).toBe(3);

        counter.value++;
        expect(doubleValue!).toBe(4);
        expect(tripleValue!).toBe(6);

        scope.stop();
        counter.value++;
        expect(doubleValue!).toBe(4);
        expect(tripleValue!).toBe(6);
    });

    it('should handle nested scopes', () =>
    {
        const counter = ref(1);
        let doubleValue: number;
        let tripleValue: number;

        const parentScope = effectScope();
        parentScope.run(() =>
        {
            effect(() =>
            {
                doubleValue = counter.value * 2;
            });

            const childScope = effectScope();
            childScope.run(() =>
            {
                effect(() =>
                {
                    tripleValue = counter.value * 3;
                });
            });

            childScope.stop();
            counter.value++;
            expect(doubleValue).toBe(4);
            expect(tripleValue).toBe(3);
        });

        parentScope.stop();
        counter.value++;
        expect(doubleValue!).toBe(4);
        expect(tripleValue!).toBe(3);
    });

    it('should handle detached scope', () =>
    {
        const counter = ref(1);
        let doubleValue: number;
        let tripleValue: number;

        const parentScope = effectScope();
        parentScope.run(() =>
        {
            effect(() =>
            {
                doubleValue = counter.value * 2;
            });

            const childScope = effectScope(true);
            childScope.run(() =>
            {
                effect(() =>
                {
                    tripleValue = counter.value * 3;
                });
            });

            childScope.stop();
            counter.value++;
            expect(doubleValue).toBe(4);
            expect(tripleValue).toBe(3);
        });

        parentScope.stop();
        counter.value++;
        expect(doubleValue!).toBe(4);
        expect(tripleValue!).toBe(3);
    });

    it('should handle onScopeDispose', () =>
    {
        const counter = ref(1);
        let disposed = false;

        const scope = effectScope();
        scope.run(() =>
        {
            onScopeDispose(() =>
            {
                disposed = true;
            });
        });

        expect(disposed).toBe(false);
        scope.stop();
        expect(disposed).toBe(true);
    });

    it('should handle getCurrentScope', () =>
    {
        const scope = effectScope();
        let currentScope: any;

        scope.run(() =>
        {
            currentScope = getCurrentScope();
        });

        expect(currentScope).toBe(scope);
        scope.stop();
        expect(getCurrentScope()).toBeUndefined();
    });

    it('should handle pause and resume', () =>
    {
        const counter = ref(1);
        let doubleValue: number;

        const scope = effectScope();
        scope.run(() =>
        {
            effect(() =>
            {
                doubleValue = counter.value * 2;
            });
        });

        expect(doubleValue!).toBe(2);
        counter.value++;
        expect(doubleValue!).toBe(4);

        scope.pause();
        counter.value++;
        expect(doubleValue!).toBe(4);

        scope.resume();
        counter.value++;
        expect(doubleValue!).toBe(6);
    });
}); 