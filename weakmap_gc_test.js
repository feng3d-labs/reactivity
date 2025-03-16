// 启用手动垃圾回收（仅在 Node.js 环境且使用 --expose-gc 选项时有效）
if (!global.gc) {
    throw new Error('请使用 --expose-gc 选项启动 Node.js 以支持手动垃圾回收');
}

// 创建一个 WeakMap
const weakMap = new WeakMap();

// 创建一个对象作为 WeakMap 的键
let keyObject = {key:{}};
const value = 'Some value';

// 将键值对添加到 WeakMap 中
weakMap.set(keyObject.key, value);

// 检查 WeakMap 中是否存在该键
console.log('添加键值对后，WeakMap 中是否存在该键:', weakMap.has(keyObject));

// 移除对键对象的引用
keyObject = null;

// 手动触发垃圾回收
global.gc();

// 再次检查 WeakMap 中是否存在该键
console.log('手动触发垃圾回收后，WeakMap 中是否存在该键:', weakMap);