// const set = new Set();

// const arr = new Array(100).fill(0).map((_, i) => () => 100 - i);

// arr.forEach(item => {
//     set.add(item);
// })

// const arr2 = [...set];
// set.forEach((v1, v2) => {
//     console.log(v1())
// })

// console.log(arr.map(item => item()))
// console.log(arr2.map(item => item()));

class MWeakMap extends WeakMap {
    set(key, value) {
        super.set(key, value);
        // console.log(key);
    }
}

const map = new MWeakMap();

map.set({ a: 1 }, 1);
map.set({}, 2);

class MArray extends Array {
    constructor(...args) {
        super(...args);
        console.log(args);
    }
}