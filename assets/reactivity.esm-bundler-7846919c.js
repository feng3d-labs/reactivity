class Reactivity {
  constructor() {
    this._parents = /* @__PURE__ */ new Map();
  }
  /**
   * 获取当前节点值。
   *
   * 取值时将会建立与父节点的依赖关系。
   */
  get value() {
    this.track();
    return this._value;
  }
  /**
   * 捕捉。
   *
   * 建立与父节点的依赖关系。
   */
  track() {
    if (!Reactivity.activeReactivity || !_shouldTrack)
      return;
    const parent = Reactivity.activeReactivity;
    if (parent) {
      this._parents.set(parent, parent._version);
    }
  }
  /**
   * 触发。
   *
   * 冒泡到所有父节点，设置失效子节点字典。
   */
  trigger() {
    this._parents.forEach((version, parent) => {
      if (parent._version !== version)
        return;
      parent.trigger();
      parent._children.set(this, this._value);
    });
    this._parents.clear();
  }
}
function forceTrack(fn) {
  const preShouldTrack = _shouldTrack;
  _shouldTrack = true;
  const result = fn();
  _shouldTrack = preShouldTrack;
  return result;
}
function noTrack(fn) {
  const preShouldTrack = _shouldTrack;
  _shouldTrack = false;
  const result = fn();
  _shouldTrack = preShouldTrack;
  return result;
}
let _shouldTrack = true;
function batch$1(dep, isRunning) {
  if (isRunning) {
    _isRunedDeps.push(dep);
  } else {
    _needEffectDeps.push(dep);
  }
}
function batchRun(fn) {
  _batchDepth++;
  const result = fn();
  if (--_batchDepth > 0) {
    return;
  }
  if (_isRunedDeps.length > 0) {
    _isRunedDeps.forEach((dep) => {
      dep._children.forEach((version, node) => {
        node._parents.set(dep, dep._version);
      });
      dep._children.clear();
    });
    _isRunedDeps.length = 0;
  }
  if (_needEffectDeps.length > 0) {
    _needEffectDeps.forEach((dep) => {
      const pre = Reactivity.activeReactivity;
      Reactivity.activeReactivity = null;
      dep.runIfDirty();
      Reactivity.activeReactivity = pre;
    });
    _needEffectDeps.length = 0;
  }
  return result;
}
let _batchDepth = 0;
const _needEffectDeps = [];
const _isRunedDeps = [];
function computed$1(func) {
  return new ComputedReactivity(func);
}
class ComputedReactivity extends Reactivity {
  /**
   * 创建计算依赖。
   * @param func 检测的可能包含响应式的函数。
   */
  constructor(func) {
    super();
    this.__v_isRef = true;
    this._children = /* @__PURE__ */ new Map();
    this._isDirty = true;
    this._version = -1;
    this._func = func;
  }
  /**
   * 获取值。
   *
   * 取值时将会建立与父节点的依赖关系。
   *
   * 同时会检查子节点是否发生变化，如果发生变化，则重新计算。
   */
  get value() {
    this.runIfDirty();
    this.track();
    return this._value;
  }
  /**
   * 触发。
   *
   * 冒泡到所有父节点，设置失效子节点字典。
   *
   * 把触发节点添加到失效子节点字典队列中。
   */
  trigger() {
    if (Reactivity.activeReactivity === this) {
      batch$1(this, Reactivity.activeReactivity === this);
    }
    super.trigger();
  }
  /**
   * 执行当前节点。
   */
  run() {
    forceTrack(() => {
      const parentReactiveNode = Reactivity.activeReactivity;
      Reactivity.activeReactivity = this;
      this._version++;
      this._value = this._func(this._value);
      Reactivity.activeReactivity = parentReactiveNode;
    });
  }
  /**
   * 检查当前节点是否脏。
   *
   * 如果脏，则执行计算。
   */
  runIfDirty() {
    this._isDirty = this._isDirty || this.isChildrenChanged();
    if (this._isDirty) {
      this._isDirty = false;
      this.run();
    }
  }
  /**
   * 判断子节点是否发生变化。
   */
  isChildrenChanged() {
    if (this._children.size === 0)
      return false;
    let isChanged = false;
    const preReactiveNode = Reactivity.activeReactivity;
    Reactivity.activeReactivity = null;
    this._children.forEach((value, node) => {
      if (isChanged)
        return;
      if (node.value !== value) {
        isChanged = true;
        return;
      }
    });
    Reactivity.activeReactivity = preReactiveNode;
    if (!isChanged) {
      this._children.forEach((version, node) => {
        node._parents.set(this, this._version);
      });
    }
    this._children.clear();
    return isChanged;
  }
}
const _EffectReactivity = class _EffectReactivity2 extends ComputedReactivity {
  constructor(func) {
    super(func);
    this._isEnable = true;
    this.runIfDirty();
  }
  pause() {
    this._isEnable = false;
  }
  resume() {
    if (this._isEnable)
      return;
    this._isEnable = true;
    if (_EffectReactivity2.pausedQueueEffects.has(this)) {
      _EffectReactivity2.pausedQueueEffects.delete(this);
      this.trigger();
    }
  }
  trigger() {
    batchRun(() => {
      super.trigger();
      if (this._isEnable) {
        batch$1(this, Reactivity.activeReactivity === this);
      } else {
        _EffectReactivity2.pausedQueueEffects.add(this);
      }
    });
  }
  /**
   * 执行当前节点。
   *
   * 当暂停时将会直接执行被包装的函数。
   */
  run() {
    if (this._isEnable) {
      super.run();
    } else {
      this._func(this._value);
    }
  }
};
_EffectReactivity.pausedQueueEffects = /* @__PURE__ */ new WeakSet();
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REACTIVE"] = "__v_isReactive";
  ReactiveFlags2["RAW"] = "__v_raw";
  ReactiveFlags2["IS_REF"] = "__v_isRef";
  return ReactiveFlags2;
})(ReactiveFlags || {});
var TargetType = /* @__PURE__ */ ((TargetType2) => {
  TargetType2[TargetType2["INVALID"] = 0] = "INVALID";
  TargetType2[TargetType2["COMMON"] = 1] = "COMMON";
  TargetType2[TargetType2["COLLECTION"] = 2] = "COLLECTION";
  return TargetType2;
})(TargetType || {});
var TrackOpTypes = /* @__PURE__ */ ((TrackOpTypes2) => {
  TrackOpTypes2["GET"] = "get";
  TrackOpTypes2["HAS"] = "has";
  TrackOpTypes2["ITERATE"] = "iterate";
  return TrackOpTypes2;
})(TrackOpTypes || {});
var TriggerOpTypes = /* @__PURE__ */ ((TriggerOpTypes2) => {
  TriggerOpTypes2["SET"] = "set";
  TriggerOpTypes2["ADD"] = "add";
  TriggerOpTypes2["DELETE"] = "delete";
  TriggerOpTypes2["CLEAR"] = "clear";
  return TriggerOpTypes2;
})(TriggerOpTypes || {});
const ITERATE_KEY$1 = Symbol("");
const MAP_KEY_ITERATE_KEY$1 = Symbol("");
const ARRAY_ITERATE_KEY$1 = Symbol("");
globalThis.__DEV__ ?? (globalThis.__DEV__ = true);
const isObject$1 = (val) => val !== null && typeof val === "object";
const isArray$1 = Array.isArray;
const isSymbol$1 = (val) => typeof val === "symbol";
const isString$1 = (val) => typeof val === "string";
const isIntegerKey$1 = (key) => isString$1(key) && key !== "NaN" && key[0] !== "-" && `${parseInt(key, 10)}` === key;
const isMap$1 = (val) => toTypeString$1(val) === "[object Map]";
const hasOwn$1 = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const hasChanged$1 = (value, oldValue) => !Object.is(value, oldValue);
function targetTypeMap$1(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return TargetType.COMMON;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return TargetType.COLLECTION;
    default:
      return TargetType.COMMON;
  }
}
function getTargetType$1(value) {
  if (!Object.isExtensible(value))
    return TargetType.INVALID;
  return targetTypeMap$1(toRawType$1(value));
}
const toTypeString$1 = (value) => Object.prototype.toString.call(value);
const toRawType$1 = (value) => (
  // 从类似 "[object RawType]" 的字符串中提取 "RawType"
  toTypeString$1(value).slice(8, -1)
);
function toRaw$1(observed) {
  const raw = observed && observed[ReactiveFlags.RAW];
  return raw ? toRaw$1(raw) : observed;
}
// @__NO_SIDE_EFFECTS__
function makeMap$1(str) {
  const map = /* @__PURE__ */ Object.create(null);
  for (const key of str.split(","))
    map[key] = 1;
  return (val) => val in map;
}
function property(target, key) {
  let depsMap = PropertyReactivity._targetMap.get(target);
  if (!depsMap) {
    depsMap = /* @__PURE__ */ new Map();
    PropertyReactivity._targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new PropertyReactivity(target, key);
    depsMap.set(key, dep);
  }
  return dep;
}
class PropertyReactivity extends Reactivity {
  constructor(target, key) {
    super();
    this._target = target;
    this._key = key;
    if (target instanceof Map || target instanceof WeakMap) {
      this._value = target.get(key);
    } else if (target instanceof Set || target instanceof WeakSet) {
      this._value = target.has(key);
    } else {
      this._value = target[key];
    }
  }
  /**
   * 获取当前节点值。
   *
   * 取值时将会建立与父节点的依赖关系。
   */
  get value() {
    this.track();
    return this._value;
  }
  set value(v) {
    if (this._key === "length") {
      v = this._target["length"];
    } else if (isSymbol$1(this._key)) {
      v = ~~this._value + 1;
    }
    if (v === this._value)
      return;
    this.trigger();
    this._value = v;
  }
  triggerIfChanged() {
  }
  /**
   * 追踪属性的变化。
   *
   * 当属性被访问时，将会追踪属性的变化。
   *
   * @param target 目标对象。
   * @param key  属性名。
   * @returns
   */
  static track(target, type, key) {
    if (!Reactivity.activeReactivity)
      return;
    const dep = property(target, key);
    dep.track();
  }
  /**
   * 触发属性的变化。
   *
   * @param target 目标对象。
   * @param type    操作类型。
   * @param key 属性名。
   * @param newValue 新值。
   * @param oldValue 旧值。
   * @returns
   */
  static trigger(target, type, key, newValue, oldValue) {
    const depsMap = this._targetMap.get(target);
    if (!depsMap)
      return;
    const run = (dep) => {
      if (dep) {
        dep.value = newValue;
      }
    };
    batchRun(() => {
      if (type === TriggerOpTypes.CLEAR) {
        depsMap.forEach(run);
      } else {
        const targetIsArray = isArray$1(target);
        const isArrayIndex = targetIsArray && isIntegerKey$1(key);
        if (targetIsArray && key === "length") {
          const newLength = Number(newValue);
          depsMap.forEach((dep, key2) => {
            if (key2 === "length" || key2 === ARRAY_ITERATE_KEY$1 || !isSymbol$1(key2) && key2 >= newLength) {
              run(dep);
            }
          });
        } else {
          if (key !== void 0 || depsMap.has(void 0)) {
            run(depsMap.get(key));
          }
          if (isArrayIndex) {
            run(depsMap.get(ARRAY_ITERATE_KEY$1));
          }
          switch (type) {
            case TriggerOpTypes.ADD:
              if (!targetIsArray) {
                run(depsMap.get(ITERATE_KEY$1));
                if (isMap$1(target)) {
                  run(depsMap.get(MAP_KEY_ITERATE_KEY$1));
                }
              } else if (isArrayIndex) {
                run(depsMap.get("length"));
              }
              break;
            case TriggerOpTypes.DELETE:
              if (!targetIsArray) {
                run(depsMap.get(ITERATE_KEY$1));
                if (isMap$1(target)) {
                  run(depsMap.get(MAP_KEY_ITERATE_KEY$1));
                }
              }
              break;
            case TriggerOpTypes.SET:
              if (isMap$1(target)) {
                run(depsMap.get(ITERATE_KEY$1));
              }
              break;
          }
        }
      }
    });
  }
}
PropertyReactivity._targetMap = /* @__PURE__ */ new WeakMap();
const arrayInstrumentations$1 = {
  __proto__: null,
  /**
   * 返回一个迭代器，用于遍历数组的响应式值
   */
  [Symbol.iterator]() {
    return iterator$1(this, Symbol.iterator, toReactive$1);
  },
  /**
   * 连接数组并返回新数组，处理响应式数组
   */
  concat(...args) {
    return reactiveReadArray$1(this).concat(
      ...args.map((x) => isArray$1(x) ? reactiveReadArray$1(x) : x)
    );
  },
  /**
   * 返回一个迭代器，用于遍历数组的键值对，并将值转换为响应式
   */
  entries() {
    return iterator$1(this, "entries", (value) => {
      value[1] = toReactive$1(value[1]);
      return value;
    });
  },
  /**
   * 测试数组中的所有元素是否都通过了指定函数的测试
   */
  every(fn, thisArg) {
    return apply$1(this, "every", fn, thisArg, void 0, arguments);
  },
  /**
   * 创建一个新数组，包含通过指定函数测试的所有元素
   */
  filter(fn, thisArg) {
    return apply$1(this, "filter", fn, thisArg, (v) => v.map(toReactive$1), arguments);
  },
  /**
   * 返回数组中满足指定测试函数的第一个元素
   */
  find(fn, thisArg) {
    return apply$1(this, "find", fn, thisArg, toReactive$1, arguments);
  },
  /**
   * 返回数组中满足指定测试函数的第一个元素的索引
   */
  findIndex(fn, thisArg) {
    return apply$1(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  /**
   * 返回数组中满足指定测试函数的最后一个元素
   */
  findLast(fn, thisArg) {
    return apply$1(this, "findLast", fn, thisArg, toReactive$1, arguments);
  },
  /**
   * 返回数组中满足指定测试函数的最后一个元素的索引
   */
  findLastIndex(fn, thisArg) {
    return apply$1(this, "findLastIndex", fn, thisArg, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  /**
   * 对数组中的每个元素执行指定函数
   */
  forEach(fn, thisArg) {
    return apply$1(this, "forEach", fn, thisArg, void 0, arguments);
  },
  /**
   * 判断数组是否包含指定元素，处理响应式值
   */
  includes(...args) {
    return searchProxy$1(this, "includes", args);
  },
  /**
   * 返回数组中指定元素第一次出现的索引，处理响应式值
   */
  indexOf(...args) {
    return searchProxy$1(this, "indexOf", args);
  },
  /**
   * 将数组的所有元素连接成一个字符串
   */
  join(separator) {
    return reactiveReadArray$1(this).join(separator);
  },
  // keys() iterator only reads `length`, no optimisation required
  /**
   * 返回数组中指定元素最后一次出现的索引，处理响应式值
   */
  lastIndexOf(...args) {
    return searchProxy$1(this, "lastIndexOf", args);
  },
  /**
   * 创建一个新数组，包含对原数组每个元素调用指定函数的结果
   */
  map(fn, thisArg) {
    return apply$1(this, "map", fn, thisArg, void 0, arguments);
  },
  /**
   * 移除数组的最后一个元素并返回该元素，避免跟踪长度变化
   */
  pop() {
    return noTracking$1(this, "pop");
  },
  /**
   * 向数组末尾添加一个或多个元素，并返回新的长度，避免跟踪长度变化
   */
  push(...args) {
    return noTracking$1(this, "push", args);
  },
  /**
   * 对数组中的每个元素执行累加器函数，并返回最终结果
   */
  reduce(fn, ...args) {
    return reduce$1(this, "reduce", fn, args);
  },
  /**
   * 从右到左对数组中的每个元素执行累加器函数，并返回最终结果
   */
  reduceRight(fn, ...args) {
    return reduce$1(this, "reduceRight", fn, args);
  },
  /**
   * 移除数组的第一个元素并返回该元素，避免跟踪长度变化
   */
  shift() {
    return noTracking$1(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  /**
   * 测试数组中的某些元素是否通过了指定函数的测试
   */
  some(fn, thisArg) {
    return apply$1(this, "some", fn, thisArg, void 0, arguments);
  },
  /**
   * 通过删除或替换现有元素或添加新元素来修改数组，避免跟踪长度变化
   */
  splice(...args) {
    return noTracking$1(this, "splice", args);
  },
  /**
   * 返回一个新数组，包含原数组的反转副本
   */
  toReversed() {
    return reactiveReadArray$1(this).toReversed();
  },
  /**
   * 返回一个新数组，包含原数组的排序副本
   */
  toSorted(comparer) {
    return reactiveReadArray$1(this).toSorted(comparer);
  },
  /**
   * 返回一个新数组，包含原数组的切片副本
   */
  toSpliced(...args) {
    return reactiveReadArray$1(this).toSpliced(...args);
  },
  /**
   * 向数组开头添加一个或多个元素，并返回新的长度，避免跟踪长度变化
   */
  unshift(...args) {
    return noTracking$1(this, "unshift", args);
  },
  /**
   * 返回一个迭代器，用于遍历数组的响应式值
   */
  values() {
    return iterator$1(this, "values", toReactive$1);
  }
};
function iterator$1(self, method, wrapValue) {
  const arr = shallowReadArray$1(self);
  const iter = arr[method]();
  if (arr !== self) {
    iter._next = iter.next;
    iter.next = () => {
      const result = iter._next();
      if (result.value) {
        result.value = wrapValue(result.value);
      }
      return result;
    };
  }
  return iter;
}
function shallowReadArray$1(arr) {
  PropertyReactivity.track(arr = toRaw$1(arr), TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY$1);
  return arr;
}
function reactiveReadArray$1(array) {
  const raw = toRaw$1(array);
  if (raw === array)
    return raw;
  PropertyReactivity.track(raw, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY$1);
  return raw.map(toReactive$1);
}
function apply$1(self, method, fn, thisArg, wrappedRetFn, args) {
  const arr = shallowReadArray$1(self);
  const needsWrap = arr !== self;
  const methodFn = arr[method];
  if (methodFn !== Array.prototype[method]) {
    const result2 = methodFn.apply(self, args);
    return needsWrap ? toReactive$1(result2) : result2;
  }
  let wrappedFn = fn;
  if (arr !== self) {
    if (needsWrap) {
      wrappedFn = function(item, index) {
        return fn.call(this, toReactive$1(item), index, self);
      };
    } else if (fn.length > 2) {
      wrappedFn = function(item, index) {
        return fn.call(this, item, index, self);
      };
    }
  }
  const result = methodFn.call(arr, wrappedFn, thisArg);
  return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce$1(self, method, fn, args) {
  const arr = shallowReadArray$1(self);
  let wrappedFn = fn;
  if (arr !== self) {
    wrappedFn = function(acc, item, index) {
      return fn.call(this, acc, toReactive$1(item), index, self);
    };
  }
  return arr[method](wrappedFn, ...args);
}
function searchProxy$1(self, method, args) {
  const arr = toRaw$1(self);
  PropertyReactivity.track(arr, TrackOpTypes.ITERATE, ARRAY_ITERATE_KEY$1);
  const res = arr[method](...args);
  if ((res === -1 || res === false) && isProxy$1(args[0])) {
    args[0] = toRaw$1(args[0]);
    return arr[method](...args);
  }
  return res;
}
function noTracking$1(self, method, args = []) {
  const res = batchRun(
    () => noTrack(
      () => toRaw$1(self)[method].apply(self, args)
    )
  );
  return res;
}
var _a;
function ref$1(value) {
  if (isRef$1(value)) {
    return value;
  }
  return new RefReactivity(value);
}
function isRef$1(r) {
  return r ? r[ReactiveFlags.IS_REF] === true : false;
}
class RefReactivity extends Reactivity {
  constructor(value) {
    super();
    this[_a] = true;
    this._rawValue = toRaw$1(value);
    this._value = toReactive$1(value);
  }
  get value() {
    this.track();
    return this._value;
  }
  set value(v) {
    const oldValue = this._rawValue;
    const newValue = toRaw$1(v);
    if (!hasChanged$1(oldValue, newValue))
      return;
    batchRun(() => {
      this.trigger();
      this._rawValue = newValue;
      this._value = toReactive$1(newValue);
    });
  }
}
_a = ReactiveFlags.IS_REF;
let BaseReactiveHandler$1 = class BaseReactiveHandler {
  /**
   * 获取对象的属性值。
   *
   * @param target 对象本身
   * @param key 属性名
   * @param receiver 代理对象
   * @returns
   */
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    } else if (key === ReactiveFlags.RAW) {
      if (receiver === reactiveMap$1.get(target) || Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
        return target;
      }
      return;
    }
    const targetIsArray = isArray$1(target);
    let fn;
    if (targetIsArray && (fn = arrayInstrumentations$1[key])) {
      return fn;
    }
    if (key === "hasOwnProperty") {
      return hasOwnProperty$2;
    }
    const res = Reflect.get(
      target,
      key,
      isRef$1(target) ? target : receiver
    );
    if (isSymbol$1(key) ? builtInSymbols$1.has(key) : isNonTrackableKeys$1(key)) {
      return res;
    }
    PropertyReactivity.track(target, TrackOpTypes.GET, key);
    if (isRef$1(res)) {
      return targetIsArray && isIntegerKey$1(key) ? res : res.value;
    }
    if (isObject$1(res)) {
      return reactive$1(res);
    }
    return res;
  }
};
let MutableReactiveHandler$1 = class MutableReactiveHandler extends BaseReactiveHandler$1 {
  /**
   * 设置对象的属性值。
   * @param target 被代理的对象。
   * @param key 属性名。
   * @param value 新值。
   * @param receiver 代理对象。
   * @returns 设置是否成功。
   */
  set(target, key, value, receiver) {
    let oldValue = target[key];
    oldValue = toRaw$1(oldValue);
    value = toRaw$1(value);
    if (!isArray$1(target) && isRef$1(oldValue) && !isRef$1(value)) {
      oldValue.value = value;
      return true;
    }
    const hadKey = isArray$1(target) && isIntegerKey$1(key) ? Number(key) < target.length : hasOwn$1(target, key);
    const result = Reflect.set(
      target,
      key,
      value,
      isRef$1(target) ? target : receiver
    );
    if (target === toRaw$1(receiver)) {
      if (!hadKey) {
        PropertyReactivity.trigger(target, TriggerOpTypes.ADD, key, value);
      } else if (hasChanged$1(value, oldValue)) {
        PropertyReactivity.trigger(target, TriggerOpTypes.SET, key, value, oldValue);
      }
    }
    return result;
  }
  /**
   * 删除对象的属性。
   *
   * @param target 被代理的对象。
   * @param key 属性名。
   * @returns 删除是否成功。
   */
  deleteProperty(target, key) {
    const hadKey = hasOwn$1(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      PropertyReactivity.trigger(target, TriggerOpTypes.DELETE, key, void 0, oldValue);
    }
    return result;
  }
  has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol$1(key) || !builtInSymbols$1.has(key)) {
      PropertyReactivity.track(target, TrackOpTypes.HAS, key);
    }
    return result;
  }
  ownKeys(target) {
    PropertyReactivity.track(
      target,
      TrackOpTypes.ITERATE,
      isArray$1(target) ? "length" : ITERATE_KEY$1
    );
    return Reflect.ownKeys(target);
  }
};
const mutableHandlers$1 = new MutableReactiveHandler$1();
function hasOwnProperty$2(key) {
  if (!isSymbol$1(key))
    key = String(key);
  const obj = toRaw$1(this);
  PropertyReactivity.track(obj, TrackOpTypes.HAS, key);
  return obj.hasOwnProperty(key);
}
const builtInSymbols$1 = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol$1)
);
const isNonTrackableKeys$1 = /* @__PURE__ */ makeMap$1(`__proto__,__v_isRef,__isVue`);
const mutableCollectionHandlers$1 = {
  get: createInstrumentationGetter$1()
};
function createInstrumentationGetter$1() {
  const instrumentations = createInstrumentations$1();
  return (target, key, receiver) => {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    } else if (key === ReactiveFlags.RAW) {
      return target;
    }
    return Reflect.get(
      hasOwn$1(instrumentations, key) && key in target ? instrumentations : target,
      key,
      receiver
    );
  };
}
function createInstrumentations$1() {
  const instrumentations = {
    get(key) {
      const target = this[ReactiveFlags.RAW];
      const rawTarget = toRaw$1(target);
      const rawKey = toRaw$1(key);
      if (hasChanged$1(key, rawKey)) {
        PropertyReactivity.track(rawTarget, TrackOpTypes.GET, key);
      }
      PropertyReactivity.track(rawTarget, TrackOpTypes.GET, rawKey);
      const { has } = getProto$1(rawTarget);
      const wrap = toReactive$1;
      if (has.call(rawTarget, key)) {
        return wrap(target.get(key));
      } else if (has.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
      } else if (target !== rawTarget) {
        target.get(key);
      }
    },
    get size() {
      const target = this[ReactiveFlags.RAW];
      PropertyReactivity.track(toRaw$1(target), TrackOpTypes.ITERATE, ITERATE_KEY$1);
      return Reflect.get(target, "size", target);
    },
    has(key) {
      const target = this[ReactiveFlags.RAW];
      const rawTarget = toRaw$1(target);
      const rawKey = toRaw$1(key);
      if (hasChanged$1(key, rawKey)) {
        PropertyReactivity.track(rawTarget, TrackOpTypes.HAS, key);
      }
      PropertyReactivity.track(rawTarget, TrackOpTypes.HAS, rawKey);
      return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
    },
    forEach(callback, thisArg) {
      const observed = this;
      const target = observed[ReactiveFlags.RAW];
      const rawTarget = toRaw$1(target);
      const wrap = toReactive$1;
      PropertyReactivity.track(rawTarget, TrackOpTypes.ITERATE, ITERATE_KEY$1);
      return target.forEach(
        (value, key) => (
          // important: make sure the callback is
          // 1. invoked with the reactive map as `this` and 3rd arg
          // 2. the value received should be a corresponding reactive/readonly.
          callback.call(thisArg, wrap(value), wrap(key), observed)
        )
      );
    },
    add(value) {
      value = toRaw$1(value);
      const target = toRaw$1(this);
      const proto = getProto$1(target);
      const hadKey = proto.has.call(target, value);
      if (!hadKey) {
        target.add(value);
        PropertyReactivity.trigger(target, TriggerOpTypes.ADD, value, value);
      }
      return this;
    },
    set(key, value) {
      value = toRaw$1(value);
      const target = toRaw$1(this);
      const { has, get } = getProto$1(target);
      let hadKey = has.call(target, key);
      if (!hadKey) {
        key = toRaw$1(key);
        hadKey = has.call(target, key);
      }
      const oldValue = get.call(target, key);
      target.set(key, value);
      if (!hadKey) {
        PropertyReactivity.trigger(target, TriggerOpTypes.ADD, key, value);
      } else if (hasChanged$1(value, oldValue)) {
        PropertyReactivity.trigger(target, TriggerOpTypes.SET, key, value, oldValue);
      }
      return this;
    },
    delete(key) {
      const target = toRaw$1(this);
      const { has, get } = getProto$1(target);
      let hadKey = has.call(target, key);
      if (!hadKey) {
        key = toRaw$1(key);
        hadKey = has.call(target, key);
      }
      const oldValue = get ? get.call(target, key) : void 0;
      const result = target.delete(key);
      if (hadKey) {
        PropertyReactivity.trigger(target, TriggerOpTypes.DELETE, key, void 0, oldValue);
      }
      return result;
    },
    clear() {
      const target = toRaw$1(this);
      const hadItems = target.size !== 0;
      const oldTarget = void 0;
      const result = target.clear();
      if (hadItems) {
        PropertyReactivity.trigger(
          target,
          TriggerOpTypes.CLEAR,
          void 0,
          void 0,
          oldTarget
        );
      }
      return result;
    }
  };
  const iteratorMethods = [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ];
  iteratorMethods.forEach((method) => {
    instrumentations[method] = createIterableMethod$1(method);
  });
  return instrumentations;
}
function createIterableMethod$1(method) {
  return function(...args) {
    const target = this[ReactiveFlags.RAW];
    const rawTarget = toRaw$1(target);
    const targetIsMap = isMap$1(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = toReactive$1;
    PropertyReactivity.track(
      rawTarget,
      TrackOpTypes.ITERATE,
      isKeyOnly ? MAP_KEY_ITERATE_KEY$1 : ITERATE_KEY$1
    );
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next();
        return done ? { value, done } : {
          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
          done
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
const getProto$1 = (v) => Reflect.getPrototypeOf(v);
function reactive$1(target) {
  if (!isObject$1(target)) {
    return target;
  }
  if (target[ReactiveFlags.RAW]) {
    return target;
  }
  const targetType = getTargetType$1(target);
  if (targetType === TargetType.INVALID) {
    return target;
  }
  const existingProxy = reactiveMap$1.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? mutableCollectionHandlers$1 : mutableHandlers$1
  );
  reactiveMap$1.set(target, proxy);
  return proxy;
}
const reactiveMap$1 = /* @__PURE__ */ new WeakMap();
const toReactive$1 = (value) => {
  if (isObject$1(value)) {
    return reactive$1(value);
  }
  return value;
};
function isProxy$1(value) {
  return value ? !!value[ReactiveFlags.RAW] : false;
}
/**
* @vue/shared v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
  const map = /* @__PURE__ */ Object.create(null);
  for (const key of str.split(","))
    map[key] = 1;
  return (val) => val in map;
}
const extend = Object.assign;
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject = (val) => val !== null && typeof val === "object";
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
/**
* @vue/reactivity v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let activeSub;
let batchDepth = 0;
let batchedSub;
let batchedComputed;
function batch(sub, isComputed = false) {
  sub.flags |= 8;
  if (isComputed) {
    sub.next = batchedComputed;
    batchedComputed = sub;
    return;
  }
  sub.next = batchedSub;
  batchedSub = sub;
}
function startBatch() {
  batchDepth++;
}
function endBatch() {
  if (--batchDepth > 0) {
    return;
  }
  if (batchedComputed) {
    let e = batchedComputed;
    batchedComputed = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= ~8;
      e = next;
    }
  }
  let error;
  while (batchedSub) {
    let e = batchedSub;
    batchedSub = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= ~8;
      if (e.flags & 1) {
        try {
          ;
          e.trigger();
        } catch (err) {
          if (!error)
            error = err;
        }
      }
      e = next;
    }
  }
  if (error)
    throw error;
}
function prepareDeps(sub) {
  for (let link = sub.deps; link; link = link.nextDep) {
    link.version = -1;
    link.prevActiveLink = link.dep.activeLink;
    link.dep.activeLink = link;
  }
}
function cleanupDeps(sub) {
  let head;
  let tail = sub.depsTail;
  let link = tail;
  while (link) {
    const prev = link.prevDep;
    if (link.version === -1) {
      if (link === tail)
        tail = prev;
      removeSub(link);
      removeDep(link);
    } else {
      head = link;
    }
    link.dep.activeLink = link.prevActiveLink;
    link.prevActiveLink = void 0;
    link = prev;
  }
  sub.deps = head;
  sub.depsTail = tail;
}
function isDirty(sub) {
  for (let link = sub.deps; link; link = link.nextDep) {
    if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) {
      return true;
    }
  }
  if (sub._dirty) {
    return true;
  }
  return false;
}
function refreshComputed(computed2) {
  if (computed2.flags & 4 && !(computed2.flags & 16)) {
    return;
  }
  computed2.flags &= ~16;
  if (computed2.globalVersion === globalVersion) {
    return;
  }
  computed2.globalVersion = globalVersion;
  const dep = computed2.dep;
  computed2.flags |= 2;
  if (dep.version > 0 && !computed2.isSSR && computed2.deps && !isDirty(computed2)) {
    computed2.flags &= ~2;
    return;
  }
  const prevSub = activeSub;
  const prevShouldTrack = shouldTrack;
  activeSub = computed2;
  shouldTrack = true;
  try {
    prepareDeps(computed2);
    const value = computed2.fn(computed2._value);
    if (dep.version === 0 || hasChanged(value, computed2._value)) {
      computed2._value = value;
      dep.version++;
    }
  } catch (err) {
    dep.version++;
    throw err;
  } finally {
    activeSub = prevSub;
    shouldTrack = prevShouldTrack;
    cleanupDeps(computed2);
    computed2.flags &= ~2;
  }
}
function removeSub(link, soft = false) {
  const { dep, prevSub, nextSub } = link;
  if (prevSub) {
    prevSub.nextSub = nextSub;
    link.prevSub = void 0;
  }
  if (nextSub) {
    nextSub.prevSub = prevSub;
    link.nextSub = void 0;
  }
  if (dep.subs === link) {
    dep.subs = prevSub;
    if (!prevSub && dep.computed) {
      dep.computed.flags &= ~4;
      for (let l = dep.computed.deps; l; l = l.nextDep) {
        removeSub(l, true);
      }
    }
  }
  if (!soft && !--dep.sc && dep.map) {
    dep.map.delete(dep.key);
  }
}
function removeDep(link) {
  const { prevDep, nextDep } = link;
  if (prevDep) {
    prevDep.nextDep = nextDep;
    link.prevDep = void 0;
  }
  if (nextDep) {
    nextDep.prevDep = prevDep;
    link.nextDep = void 0;
  }
}
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
let globalVersion = 0;
class Link {
  constructor(sub, dep) {
    this.sub = sub;
    this.dep = dep;
    this.version = dep.version;
    this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Dep {
  constructor(computed2) {
    this.computed = computed2;
    this.version = 0;
    this.activeLink = void 0;
    this.subs = void 0;
    this.map = void 0;
    this.key = void 0;
    this.sc = 0;
  }
  track(debugInfo) {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return;
    }
    let link = this.activeLink;
    if (link === void 0 || link.sub !== activeSub) {
      link = this.activeLink = new Link(activeSub, this);
      if (!activeSub.deps) {
        activeSub.deps = activeSub.depsTail = link;
      } else {
        link.prevDep = activeSub.depsTail;
        activeSub.depsTail.nextDep = link;
        activeSub.depsTail = link;
      }
      addSub(link);
    } else if (link.version === -1) {
      link.version = this.version;
      if (link.nextDep) {
        const next = link.nextDep;
        next.prevDep = link.prevDep;
        if (link.prevDep) {
          link.prevDep.nextDep = next;
        }
        link.prevDep = activeSub.depsTail;
        link.nextDep = void 0;
        activeSub.depsTail.nextDep = link;
        activeSub.depsTail = link;
        if (activeSub.deps === link) {
          activeSub.deps = next;
        }
      }
    }
    return link;
  }
  trigger(debugInfo) {
    this.version++;
    globalVersion++;
    this.notify(debugInfo);
  }
  notify(debugInfo) {
    startBatch();
    try {
      if (false)
        ;
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          ;
          link.sub.dep.notify();
        }
      }
    } finally {
      endBatch();
    }
  }
}
function addSub(link) {
  link.dep.sc++;
  if (link.sub.flags & 4) {
    const computed2 = link.dep.computed;
    if (computed2 && !link.dep.subs) {
      computed2.flags |= 4 | 16;
      for (let l = computed2.deps; l; l = l.nextDep) {
        addSub(l);
      }
    }
    const currentTail = link.dep.subs;
    if (currentTail !== link) {
      link.prevSub = currentTail;
      if (currentTail)
        currentTail.nextSub = link;
    }
    link.dep.subs = link;
  }
}
const targetMap = /* @__PURE__ */ new WeakMap();
const ITERATE_KEY = Symbol(
  ""
);
const MAP_KEY_ITERATE_KEY = Symbol(
  ""
);
const ARRAY_ITERATE_KEY = Symbol(
  ""
);
function track(target, type, key) {
  if (shouldTrack && activeSub) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Dep());
      dep.map = depsMap;
      dep.key = key;
    }
    {
      dep.track();
    }
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    globalVersion++;
    return;
  }
  const run = (dep) => {
    if (dep) {
      {
        dep.trigger();
      }
    }
  };
  startBatch();
  if (type === "clear") {
    depsMap.forEach(run);
  } else {
    const targetIsArray = isArray(target);
    const isArrayIndex = targetIsArray && isIntegerKey(key);
    if (targetIsArray && key === "length") {
      const newLength = Number(newValue);
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) {
          run(dep);
        }
      });
    } else {
      if (key !== void 0 || depsMap.has(void 0)) {
        run(depsMap.get(key));
      }
      if (isArrayIndex) {
        run(depsMap.get(ARRAY_ITERATE_KEY));
      }
      switch (type) {
        case "add":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isArrayIndex) {
            run(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            run(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
  }
  endBatch();
}
function reactiveReadArray(array) {
  const raw = toRaw(array);
  if (raw === array)
    return raw;
  track(raw, "iterate", ARRAY_ITERATE_KEY);
  return isShallow(array) ? raw : raw.map(toReactive);
}
function shallowReadArray(arr) {
  track(arr = toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
  return arr;
}
const arrayInstrumentations = {
  __proto__: null,
  [Symbol.iterator]() {
    return iterator(this, Symbol.iterator, toReactive);
  },
  concat(...args) {
    return reactiveReadArray(this).concat(
      ...args.map((x) => isArray(x) ? reactiveReadArray(x) : x)
    );
  },
  entries() {
    return iterator(this, "entries", (value) => {
      value[1] = toReactive(value[1]);
      return value;
    });
  },
  every(fn, thisArg) {
    return apply(this, "every", fn, thisArg, void 0, arguments);
  },
  filter(fn, thisArg) {
    return apply(this, "filter", fn, thisArg, (v) => v.map(toReactive), arguments);
  },
  find(fn, thisArg) {
    return apply(this, "find", fn, thisArg, toReactive, arguments);
  },
  findIndex(fn, thisArg) {
    return apply(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  findLast(fn, thisArg) {
    return apply(this, "findLast", fn, thisArg, toReactive, arguments);
  },
  findLastIndex(fn, thisArg) {
    return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(fn, thisArg) {
    return apply(this, "forEach", fn, thisArg, void 0, arguments);
  },
  includes(...args) {
    return searchProxy(this, "includes", args);
  },
  indexOf(...args) {
    return searchProxy(this, "indexOf", args);
  },
  join(separator) {
    return reactiveReadArray(this).join(separator);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...args) {
    return searchProxy(this, "lastIndexOf", args);
  },
  map(fn, thisArg) {
    return apply(this, "map", fn, thisArg, void 0, arguments);
  },
  pop() {
    return noTracking(this, "pop");
  },
  push(...args) {
    return noTracking(this, "push", args);
  },
  reduce(fn, ...args) {
    return reduce(this, "reduce", fn, args);
  },
  reduceRight(fn, ...args) {
    return reduce(this, "reduceRight", fn, args);
  },
  shift() {
    return noTracking(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(fn, thisArg) {
    return apply(this, "some", fn, thisArg, void 0, arguments);
  },
  splice(...args) {
    return noTracking(this, "splice", args);
  },
  toReversed() {
    return reactiveReadArray(this).toReversed();
  },
  toSorted(comparer) {
    return reactiveReadArray(this).toSorted(comparer);
  },
  toSpliced(...args) {
    return reactiveReadArray(this).toSpliced(...args);
  },
  unshift(...args) {
    return noTracking(this, "unshift", args);
  },
  values() {
    return iterator(this, "values", toReactive);
  }
};
function iterator(self, method, wrapValue) {
  const arr = shallowReadArray(self);
  const iter = arr[method]();
  if (arr !== self && !isShallow(self)) {
    iter._next = iter.next;
    iter.next = () => {
      const result = iter._next();
      if (result.value) {
        result.value = wrapValue(result.value);
      }
      return result;
    };
  }
  return iter;
}
const arrayProto = Array.prototype;
function apply(self, method, fn, thisArg, wrappedRetFn, args) {
  const arr = shallowReadArray(self);
  const needsWrap = arr !== self && !isShallow(self);
  const methodFn = arr[method];
  if (methodFn !== arrayProto[method]) {
    const result2 = methodFn.apply(self, args);
    return needsWrap ? toReactive(result2) : result2;
  }
  let wrappedFn = fn;
  if (arr !== self) {
    if (needsWrap) {
      wrappedFn = function(item, index) {
        return fn.call(this, toReactive(item), index, self);
      };
    } else if (fn.length > 2) {
      wrappedFn = function(item, index) {
        return fn.call(this, item, index, self);
      };
    }
  }
  const result = methodFn.call(arr, wrappedFn, thisArg);
  return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self, method, fn, args) {
  const arr = shallowReadArray(self);
  let wrappedFn = fn;
  if (arr !== self) {
    if (!isShallow(self)) {
      wrappedFn = function(acc, item, index) {
        return fn.call(this, acc, toReactive(item), index, self);
      };
    } else if (fn.length > 3) {
      wrappedFn = function(acc, item, index) {
        return fn.call(this, acc, item, index, self);
      };
    }
  }
  return arr[method](wrappedFn, ...args);
}
function searchProxy(self, method, args) {
  const arr = toRaw(self);
  track(arr, "iterate", ARRAY_ITERATE_KEY);
  const res = arr[method](...args);
  if ((res === -1 || res === false) && isProxy(args[0])) {
    args[0] = toRaw(args[0]);
    return arr[method](...args);
  }
  return res;
}
function noTracking(self, method, args = []) {
  pauseTracking();
  startBatch();
  const res = toRaw(self)[method].apply(self, args);
  endBatch();
  resetTracking();
  return res;
}
const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol)
);
function hasOwnProperty(key) {
  if (!isSymbol(key))
    key = String(key);
  const obj = toRaw(this);
  track(obj, "has", key);
  return obj.hasOwnProperty(key);
}
class BaseReactiveHandler2 {
  constructor(_isReadonly = false, _isShallow = false) {
    this._isReadonly = _isReadonly;
    this._isShallow = _isShallow;
  }
  get(target, key, receiver) {
    if (key === "__v_skip")
      return target["__v_skip"];
    const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_isShallow") {
      return isShallow2;
    } else if (key === "__v_raw") {
      if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
        return target;
      }
      return;
    }
    const targetIsArray = isArray(target);
    if (!isReadonly2) {
      let fn;
      if (targetIsArray && (fn = arrayInstrumentations[key])) {
        return fn;
      }
      if (key === "hasOwnProperty") {
        return hasOwnProperty;
      }
    }
    const res = Reflect.get(
      target,
      key,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      isRef(target) ? target : receiver
    );
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
    }
    if (isShallow2) {
      return res;
    }
    if (isRef(res)) {
      return targetIsArray && isIntegerKey(key) ? res : res.value;
    }
    if (isObject(res)) {
      return isReadonly2 ? readonly(res) : reactive(res);
    }
    return res;
  }
}
class MutableReactiveHandler2 extends BaseReactiveHandler2 {
  constructor(isShallow2 = false) {
    super(false, isShallow2);
  }
  set(target, key, value, receiver) {
    let oldValue = target[key];
    if (!this._isShallow) {
      const isOldValueReadonly = isReadonly(oldValue);
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue);
        value = toRaw(value);
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        if (isOldValueReadonly) {
          return false;
        } else {
          oldValue.value = value;
          return true;
        }
      }
    }
    const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(
      target,
      key,
      value,
      isRef(target) ? target : receiver
    );
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value);
      }
    }
    return result;
  }
  deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0);
    }
    return result;
  }
  has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  ownKeys(target) {
    track(
      target,
      "iterate",
      isArray(target) ? "length" : ITERATE_KEY
    );
    return Reflect.ownKeys(target);
  }
}
class ReadonlyReactiveHandler extends BaseReactiveHandler2 {
  constructor(isShallow2 = false) {
    super(true, isShallow2);
  }
  set(target, key) {
    return true;
  }
  deleteProperty(target, key) {
    return true;
  }
}
const mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler2();
const readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
  return function(...args) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
    !isReadonly2 && track(
      rawTarget,
      "iterate",
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    );
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next();
        return done ? { value, done } : {
          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
          done
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    return type === "delete" ? false : type === "clear" ? void 0 : this;
  };
}
function createInstrumentations(readonly2, shallow) {
  const instrumentations = {
    get(key) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const rawKey = toRaw(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "get", key);
        }
        track(rawTarget, "get", rawKey);
      }
      const { has } = getProto(rawTarget);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      if (has.call(rawTarget, key)) {
        return wrap(target.get(key));
      } else if (has.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
      } else if (target !== rawTarget) {
        target.get(key);
      }
    },
    get size() {
      const target = this["__v_raw"];
      !readonly2 && track(toRaw(target), "iterate", ITERATE_KEY);
      return Reflect.get(target, "size", target);
    },
    has(key) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const rawKey = toRaw(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "has", key);
        }
        track(rawTarget, "has", rawKey);
      }
      return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
    },
    forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      !readonly2 && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    }
  };
  extend(
    instrumentations,
    readonly2 ? {
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear")
    } : {
      add(value) {
        if (!shallow && !isShallow(value) && !isReadonly(value)) {
          value = toRaw(value);
        }
        const target = toRaw(this);
        const proto = getProto(target);
        const hadKey = proto.has.call(target, value);
        if (!hadKey) {
          target.add(value);
          trigger(target, "add", value, value);
        }
        return this;
      },
      set(key, value) {
        if (!shallow && !isShallow(value) && !isReadonly(value)) {
          value = toRaw(value);
        }
        const target = toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = toRaw(key);
          hadKey = has.call(target, key);
        }
        const oldValue = get.call(target, key);
        target.set(key, value);
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value);
        }
        return this;
      },
      delete(key) {
        const target = toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = toRaw(key);
          hadKey = has.call(target, key);
        }
        get ? get.call(target, key) : void 0;
        const result = target.delete(key);
        if (hadKey) {
          trigger(target, "delete", key, void 0);
        }
        return result;
      },
      clear() {
        const target = toRaw(this);
        const hadItems = target.size !== 0;
        const result = target.clear();
        if (hadItems) {
          trigger(
            target,
            "clear",
            void 0,
            void 0
          );
        }
        return result;
      }
    }
  );
  const iteratorMethods = [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ];
  iteratorMethods.forEach((method) => {
    instrumentations[method] = createIterableMethod(method, readonly2, shallow);
  });
  return instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
  const instrumentations = createInstrumentations(isReadonly2, shallow);
  return (target, key, receiver) => {
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_raw") {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target ? instrumentations : target,
      key,
      receiver
    );
  };
}
const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const reactiveMap = /* @__PURE__ */ new WeakMap();
const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
const readonlyMap = /* @__PURE__ */ new WeakMap();
const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function getTargetType(value) {
  return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
}
function reactive(target) {
  if (isReadonly(target)) {
    return target;
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  );
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const proxy = new Proxy(
    target,
    targetType === 2 ? collectionHandlers : baseHandlers
  );
  proxyMap.set(target, proxy);
  return proxy;
}
function isReadonly(value) {
  return !!(value && value["__v_isReadonly"]);
}
function isShallow(value) {
  return !!(value && value["__v_isShallow"]);
}
function isProxy(value) {
  return value ? !!value["__v_raw"] : false;
}
function toRaw(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? toRaw(raw) : observed;
}
const toReactive = (value) => isObject(value) ? reactive(value) : value;
const toReadonly = (value) => isObject(value) ? readonly(value) : value;
function isRef(r) {
  return r ? r["__v_isRef"] === true : false;
}
function ref(value) {
  return createRef(value, false);
}
function createRef(rawValue, shallow) {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}
class RefImpl {
  constructor(value, isShallow2) {
    this.dep = new Dep();
    this["__v_isRef"] = true;
    this["__v_isShallow"] = false;
    this._rawValue = isShallow2 ? value : toRaw(value);
    this._value = isShallow2 ? value : toReactive(value);
    this["__v_isShallow"] = isShallow2;
  }
  get value() {
    {
      this.dep.track();
    }
    return this._value;
  }
  set value(newValue) {
    const oldValue = this._rawValue;
    const useDirectValue = this["__v_isShallow"] || isShallow(newValue) || isReadonly(newValue);
    newValue = useDirectValue ? newValue : toRaw(newValue);
    if (hasChanged(newValue, oldValue)) {
      this._rawValue = newValue;
      this._value = useDirectValue ? newValue : toReactive(newValue);
      {
        this.dep.trigger();
      }
    }
  }
}
class ComputedRefImpl {
  constructor(fn, setter, isSSR) {
    this.fn = fn;
    this.setter = setter;
    this._value = void 0;
    this.dep = new Dep(this);
    this.__v_isRef = true;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 16;
    this.globalVersion = globalVersion - 1;
    this.next = void 0;
    this.effect = this;
    this["__v_isReadonly"] = !setter;
    this.isSSR = isSSR;
  }
  /**
   * @internal
   */
  notify() {
    this.flags |= 16;
    if (!(this.flags & 8) && // avoid infinite self recursion
    activeSub !== this) {
      batch(this, true);
      return true;
    }
  }
  get value() {
    const link = this.dep.track();
    refreshComputed(this);
    if (link) {
      link.version = this.dep.version;
    }
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    }
  }
}
function computed(getterOrOptions, debugOptions, isSSR = false) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const cRef = new ComputedRefImpl(getter, setter, isSSR);
  return cRef;
}
export {
  computed as a,
  ref as b,
  computed$1 as c,
  ref$1 as r
};
