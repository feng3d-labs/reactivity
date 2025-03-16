
const gc = () => {
    return new Promise(resolve => {
        setTimeout(() => {
            global.gc()
            resolve()
        })
    })
}

const weak = new WeakMap();
weak.set({a:1}, {});

console.log(weak);

await gc()

console.log(weak);
