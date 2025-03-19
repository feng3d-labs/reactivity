
function getA(a: { a: number }) {
    if (!a) return 0;

    return a.a;
}

function getB(b: { a: { a: number, }, b: number }) {
    if (!b) return 0;

    const ba = getA(b.a);
    return b.b + ba;
}

function getC(c: { a: { a: number, }, b: { a: { a: number, }, b: number }, c: number }) {
    if (!c) return 0;

    const ca = getA(c.a);
    const cb = getB(c.b);
    return ca + cb + c.c;
}

export function test2(num: number) {
    const a = { a: 1 };
    const b = { a, b: 2 };
    const c = { a, b, c: 3 };

    console.log(getC(c));
    c.b = null as any;
    console.log(getC(c));

    a.a++;
    a.a--;
    for (let i = 0; i < num; i++) {
        getC(c);
    }
}

