class Reactivity {
  constructor() {
    this._parents = /* @__PURE__ */ new Map();
  }
  /**
   * 获取当前节点值。
   *
   * 取值时将会建立与父节点的依赖关系。
   * 当其他响应式节点访问此值时，会自动建立依赖关系。
   */
  get value() {
    this.track();
    return this._value;
  }
  /**
   * 建立依赖关系。
   *
   * 当其他节点访问当前节点的值时，会调用此方法。
   * 将当前节点与访问者（父节点）建立依赖关系。
   *
   * 如果当前没有活动的响应式节点，或者不应该跟踪依赖，则不会建立依赖关系。
   */
  track() {
    if (!Reactivity.activeReactivity || !_shouldTrack) return;
    const parent = Reactivity.activeReactivity;
    if (parent) {
      this._parents.set(parent, parent._version);
    }
  }
  /**
   * 触发更新。
   *
   * 当节点值发生变化时，会调用此方法。
   * 通知所有依赖此节点的父节点进行更新。
   *
   * 更新过程：
   * 1. 遍历所有父节点
   * 2. 检查父节点的版本号是否匹配
   * 3. 触发父节点的更新
   * 4. 将当前节点添加到父节点的失效子节点集合中
   */
  trigger() {
    this._parents.forEach((version, parent) => {
      if (parent._version !== version) return;
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
   * 创建计算反应式节点。
   *
   * @param func 计算函数，可以访问其他响应式数据，并返回计算结果
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
   * 获取计算属性的值。
   *
   * 取值时会：
   * 1. 检查是否需要重新计算
   * 2. 建立与父节点的依赖关系
   * 3. 返回当前值
   */
  get value() {
    this.runIfDirty();
    this.track();
    return this._value;
  }
  /**
   * 触发更新。
   *
   * 当依赖发生变化时，会调用此方法。
   * 如果当前正在执行计算，会将更新延迟到计算完成后。
   * 否则，立即通知所有父节点进行更新。
   */
  trigger() {
    if (Reactivity.activeReactivity === this) {
      batch$1(this, Reactivity.activeReactivity === this);
    }
    super.trigger();
  }
  /**
   * 执行计算。
   *
   * 执行计算函数，更新当前值。
   * 在计算过程中会：
   * 1. 强制启用依赖跟踪
   * 2. 保存并设置当前活动节点
   * 3. 执行计算函数
   * 4. 恢复活动节点
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
   * 检查并执行计算。
   *
   * 检查当前节点是否需要重新计算：
   * 1. 如果脏标记为 true，需要重新计算
   * 2. 如果子节点发生变化，需要重新计算
   *
   * 重新计算后会清除脏标记。
   */
  runIfDirty() {
    this._isDirty = this._isDirty || this.isChildrenChanged();
    if (this._isDirty) {
      this._isDirty = false;
      this.run();
    }
  }
  /**
   * 检查子节点是否发生变化。
   *
   * 遍历所有子节点，检查它们的值是否发生变化。
   * 如果发生变化，返回 true，否则返回 false。
   *
   * 在检查过程中会：
   * 1. 临时禁用依赖跟踪
   * 2. 检查每个子节点的值
   * 3. 如果子节点没有变化，重新建立依赖关系
   * 4. 清空子节点集合
   *
   * @returns 是否有子节点发生变化
   */
  isChildrenChanged() {
    if (this._children.size === 0) return false;
    let isChanged = false;
    const preReactiveNode = Reactivity.activeReactivity;
    Reactivity.activeReactivity = null;
    this._children.forEach((value, node) => {
      if (isChanged) return;
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
  if (!Object.isExtensible(value)) return TargetType.INVALID;
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
  for (const key of str.split(",")) map[key] = 1;
  return (val) => val in map;
}
const _EffectReactivity = class _EffectReactivity2 extends ComputedReactivity {
  constructor(func) {
    super(func);
    this._isEnable = true;
    this.runIfDirty();
  }
  /**
   * 暂停效果。
   *
   * 暂停后，当依赖发生变化时不会自动执行。
   */
  pause() {
    this._isEnable = false;
  }
  /**
   * 恢复效果。
   *
   * 恢复后，当依赖发生变化时会自动执行。
   */
  resume() {
    if (this._isEnable) return;
    this._isEnable = true;
    if (_EffectReactivity2.pausedQueueEffects.has(this)) {
      _EffectReactivity2.pausedQueueEffects.delete(this);
      this.trigger();
    }
  }
  /**
   * 停止效果。
   *
   * 停止后，效果将不再响应依赖的变化。
   */
  stop() {
    this._isEnable = false;
    _EffectReactivity2.pausedQueueEffects.delete(this);
  }
  /**
   * 触发效果执行。
   *
   * 当依赖发生变化时，会调用此方法。
   */
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
const _PropertyReactivity = class _PropertyReactivity2 extends Reactivity {
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
    if (v === this._value) return;
    this.trigger();
    this._value = v;
  }
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
    if (!Reactivity.activeReactivity) return;
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
    if (!depsMap) return;
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
};
_PropertyReactivity._targetMap = /* @__PURE__ */ new WeakMap();
let PropertyReactivity = _PropertyReactivity;
const arrayInstrumentations$1 = {
  __proto__: null,
  /**
   * 返回一个迭代器，用于遍历数组的响应式值。
   *
   * 实现了以下功能：
   * 1. 创建数组的迭代器
   * 2. 自动将迭代的值转换为响应式
   * 3. 自动追踪数组的访问
   *
   * @returns 数组的迭代器
   */
  [Symbol.iterator]() {
    return iterator$1(this, Symbol.iterator, toReactive$1);
  },
  /**
   * 连接数组并返回新数组。
   *
   * 实现了以下功能：
   * 1. 处理响应式数组的连接
   * 2. 自动将参数中的数组转换为响应式
   * 3. 保持原始值的引用
   *
   * @param args 要连接的数组或值
   * @returns 连接后的新数组
   */
  concat(...args) {
    return reactiveReadArray$1(this).concat(
      ...args.map((x) => isArray$1(x) ? reactiveReadArray$1(x) : x)
    );
  },
  /**
   * 返回一个迭代器，用于遍历数组的键值对。
   *
   * 实现了以下功能：
   * 1. 创建数组的键值对迭代器
   * 2. 自动将值转换为响应式
   * 3. 自动追踪数组的访问
   *
   * @returns 数组的键值对迭代器
   */
  entries() {
    return iterator$1(this, "entries", (value) => {
      value[1] = toReactive$1(value[1]);
      return value;
    });
  },
  /**
   * 测试数组中的所有元素是否都通过了指定函数的测试。
   *
   * 实现了以下功能：
   * 1. 遍历数组元素
   * 2. 对每个元素执行测试函数
   * 3. 自动追踪数组的访问
   * 4. 处理响应式值的测试
   *
   * @param fn 测试函数
   * @param thisArg 测试函数的 this 值
   * @returns 如果所有元素都通过测试则返回 true，否则返回 false
   */
  every(fn, thisArg) {
    return apply$1(this, "every", fn, thisArg, void 0, arguments);
  },
  /**
   * 创建一个新数组，包含通过指定函数测试的所有元素。
   *
   * 实现了以下功能：
   * 1. 遍历数组元素
   * 2. 对每个元素执行测试函数
   * 3. 自动追踪数组的访问
   * 4. 自动将结果转换为响应式
   *
   * @param fn 测试函数
   * @param thisArg 测试函数的 this 值
   * @returns 包含通过测试的元素的新数组
   */
  filter(fn, thisArg) {
    return apply$1(this, "filter", fn, thisArg, (v) => v.map(toReactive$1), arguments);
  },
  /**
   * 返回数组中满足指定测试函数的第一个元素。
   *
   * 实现了以下功能：
   * 1. 遍历数组元素
   * 2. 对每个元素执行测试函数
   * 3. 自动追踪数组的访问
   * 4. 自动将结果转换为响应式
   *
   * @param fn 测试函数
   * @param thisArg 测试函数的 this 值
   * @returns 第一个满足测试的元素，如果没有则返回 undefined
   */
  find(fn, thisArg) {
    return apply$1(this, "find", fn, thisArg, toReactive$1, arguments);
  },
  /**
   * 返回数组中满足指定测试函数的第一个元素的索引。
   *
   * 实现了以下功能：
   * 1. 遍历数组元素
   * 2. 对每个元素执行测试函数
   * 3. 自动追踪数组的访问
   * 4. 处理响应式值的查找
   *
   * @param fn 测试函数
   * @param thisArg 测试函数的 this 值
   * @returns 第一个满足测试的元素的索引，如果没有则返回 -1
   */
  findIndex(fn, thisArg) {
    return apply$1(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  /**
   * 返回数组中满足指定测试函数的最后一个元素。
   *
   * 实现了以下功能：
   * 1. 从后向前遍历数组元素
   * 2. 对每个元素执行测试函数
   * 3. 自动追踪数组的访问
   * 4. 自动将结果转换为响应式
   *
   * @param fn 测试函数
   * @param thisArg 测试函数的 this 值
   * @returns 最后一个满足测试的元素，如果没有则返回 undefined
   */
  findLast(fn, thisArg) {
    return apply$1(this, "findLast", fn, thisArg, toReactive$1, arguments);
  },
  /**
   * 返回数组中满足指定测试函数的最后一个元素的索引。
   *
   * 实现了以下功能：
   * 1. 从后向前遍历数组元素
   * 2. 对每个元素执行测试函数
   * 3. 自动追踪数组的访问
   * 4. 处理响应式值的查找
   *
   * @param fn 测试函数
   * @param thisArg 测试函数的 this 值
   * @returns 最后一个满足测试的元素的索引，如果没有则返回 -1
   */
  findLastIndex(fn, thisArg) {
    return apply$1(this, "findLastIndex", fn, thisArg, void 0, arguments);
  },
  // flat, flatMap 可以从 ARRAY_ITERATE 中受益，但实现起来不太直接
  /**
   * 对数组中的每个元素执行指定函数。
   *
   * 实现了以下功能：
   * 1. 遍历数组元素
   * 2. 对每个元素执行回调函数
   * 3. 自动追踪数组的访问
   * 4. 处理响应式值的遍历
   *
   * @param fn 回调函数
   * @param thisArg 回调函数的 this 值
   */
  forEach(fn, thisArg) {
    return apply$1(this, "forEach", fn, thisArg, void 0, arguments);
  },
  /**
   * 判断数组是否包含指定元素。
   *
   * 实现了以下功能：
   * 1. 处理响应式值的查找
   * 2. 自动追踪数组的访问
   * 3. 处理代理对象的查找
   *
   * @param args 要查找的元素
   * @returns 如果数组包含该元素则返回 true，否则返回 false
   */
  includes(...args) {
    return searchProxy$1(this, "includes", args);
  },
  /**
   * 返回数组中指定元素第一次出现的索引。
   *
   * 实现了以下功能：
   * 1. 处理响应式值的查找
   * 2. 自动追踪数组的访问
   * 3. 处理代理对象的查找
   *
   * @param args 要查找的元素
   * @returns 元素第一次出现的索引，如果没有则返回 -1
   */
  indexOf(...args) {
    return searchProxy$1(this, "indexOf", args);
  },
  /**
   * 将数组的所有元素连接成一个字符串。
   *
   * 实现了以下功能：
   * 1. 处理响应式数组的连接
   * 2. 自动追踪数组的访问
   * 3. 保持原始值的引用
   *
   * @param separator 分隔符
   * @returns 连接后的字符串
   */
  join(separator) {
    return reactiveReadArray$1(this).join(separator);
  },
  // keys() 迭代器只读取 length，不需要优化
  /**
   * 返回数组中指定元素最后一次出现的索引。
   *
   * 实现了以下功能：
   * 1. 处理响应式值的查找
   * 2. 自动追踪数组的访问
   * 3. 处理代理对象的查找
   *
   * @param args 要查找的元素
   * @returns 元素最后一次出现的索引，如果没有则返回 -1
   */
  lastIndexOf(...args) {
    return searchProxy$1(this, "lastIndexOf", args);
  },
  /**
   * 创建一个新数组，包含对原数组每个元素调用指定函数的结果。
   *
   * 实现了以下功能：
   * 1. 遍历数组元素
   * 2. 对每个元素执行映射函数
   * 3. 自动追踪数组的访问
   * 4. 处理响应式值的映射
   *
   * @param fn 映射函数
   * @param thisArg 映射函数的 this 值
   * @returns 包含映射结果的新数组
   */
  map(fn, thisArg) {
    return apply$1(this, "map", fn, thisArg, void 0, arguments);
  },
  /**
   * 移除数组的最后一个元素并返回该元素。
   *
   * 实现了以下功能：
   * 1. 移除最后一个元素
   * 2. 避免跟踪长度变化
   * 3. 处理响应式值的移除
   *
   * @returns 被移除的元素
   */
  pop() {
    return noTracking$1(this, "pop");
  },
  /**
   * 向数组末尾添加一个或多个元素。
   *
   * 实现了以下功能：
   * 1. 添加新元素
   * 2. 避免跟踪长度变化
   * 3. 处理响应式值的添加
   *
   * @param args 要添加的元素
   * @returns 数组的新长度
   */
  push(...args) {
    return noTracking$1(this, "push", args);
  },
  /**
   * 对数组中的每个元素执行累加器函数。
   *
   * 实现了以下功能：
   * 1. 从左到右遍历数组元素
   * 2. 对每个元素执行累加器函数
   * 3. 自动追踪数组的访问
   * 4. 处理响应式值的累加
   *
   * @param fn 累加器函数
   * @param args 初始值（可选）
   * @returns 累加的结果
   */
  reduce(fn, ...args) {
    return reduce$1(this, "reduce", fn, args);
  },
  /**
   * 从右到左对数组中的每个元素执行累加器函数。
   *
   * 实现了以下功能：
   * 1. 从右到左遍历数组元素
   * 2. 对每个元素执行累加器函数
   * 3. 自动追踪数组的访问
   * 4. 处理响应式值的累加
   *
   * @param fn 累加器函数
   * @param args 初始值（可选）
   * @returns 累加的结果
   */
  reduceRight(fn, ...args) {
    return reduce$1(this, "reduceRight", fn, args);
  },
  /**
   * 移除数组的第一个元素并返回该元素。
   *
   * 实现了以下功能：
   * 1. 移除第一个元素
   * 2. 避免跟踪长度变化
   * 3. 处理响应式值的移除
   *
   * @returns 被移除的元素
   */
  shift() {
    return noTracking$1(this, "shift");
  },
  // slice 可以使用 ARRAY_ITERATE，但似乎也需要范围追踪
  /**
   * 测试数组中的某些元素是否通过了指定函数的测试。
   *
   * 实现了以下功能：
   * 1. 遍历数组元素
   * 2. 对每个元素执行测试函数
   * 3. 自动追踪数组的访问
   * 4. 处理响应式值的测试
   *
   * @param fn 测试函数
   * @param thisArg 测试函数的 this 值
   * @returns 如果有元素通过测试则返回 true，否则返回 false
   */
  some(fn, thisArg) {
    return apply$1(this, "some", fn, thisArg, void 0, arguments);
  },
  /**
   * 通过删除或替换现有元素或添加新元素来修改数组。
   *
   * 实现了以下功能：
   * 1. 修改数组内容
   * 2. 避免跟踪长度变化
   * 3. 处理响应式值的修改
   *
   * @param args 要删除的起始索引、要删除的元素数量和要添加的元素
   * @returns 包含被删除元素的新数组
   */
  splice(...args) {
    return noTracking$1(this, "splice", args);
  },
  /**
   * 返回一个新数组，包含原数组的反转副本。
   *
   * 实现了以下功能：
   * 1. 创建数组的反转副本
   * 2. 自动将结果转换为响应式
   * 3. 保持原始值的引用
   *
   * @returns 反转后的新数组
   */
  toReversed() {
    return reactiveReadArray$1(this).toReversed();
  },
  /**
   * 返回一个新数组，包含原数组的排序副本。
   *
   * 实现了以下功能：
   * 1. 创建数组的排序副本
   * 2. 自动将结果转换为响应式
   * 3. 保持原始值的引用
   *
   * @param comparer 比较函数
   * @returns 排序后的新数组
   */
  toSorted(comparer) {
    return reactiveReadArray$1(this).toSorted(comparer);
  },
  /**
   * 返回一个新数组，包含原数组的切片副本。
   *
   * 实现了以下功能：
   * 1. 创建数组的切片副本
   * 2. 自动将结果转换为响应式
   * 3. 保持原始值的引用
   *
   * @param args 起始索引和结束索引
   * @returns 切片后的新数组
   */
  toSpliced(...args) {
    return reactiveReadArray$1(this).toSpliced(...args);
  },
  /**
   * 向数组开头添加一个或多个元素。
   *
   * 实现了以下功能：
   * 1. 添加新元素
   * 2. 避免跟踪长度变化
   * 3. 处理响应式值的添加
   *
   * @param args 要添加的元素
   * @returns 数组的新长度
   */
  unshift(...args) {
    return noTracking$1(this, "unshift", args);
  },
  /**
   * 返回一个迭代器，用于遍历数组的值。
   *
   * 实现了以下功能：
   * 1. 创建数组的值迭代器
   * 2. 自动将迭代的值转换为响应式
   * 3. 自动追踪数组的访问
   *
   * @returns 数组的值迭代器
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
  if (raw === array) return raw;
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
var _a, _b;
function ref$1(value) {
  if (isRef$1(value)) {
    return value;
  }
  return new RefReactivity(value);
}
function isRef$1(r) {
  return r ? r[ReactiveFlags.IS_REF] === true : false;
}
class RefReactivity extends (_b = Reactivity, _a = ReactiveFlags.IS_REF, _b) {
  /**
   * 创建引用反应式节点。
   *
   * @param value 要包装的值
   */
  constructor(value) {
    super();
    this[_a] = true;
    this._rawValue = toRaw$1(value);
    this._value = toReactive$1(value);
  }
  /**
   * 获取引用的值。
   *
   * 取值时会：
   * 1. 建立依赖关系
   * 2. 返回当前值
   */
  get value() {
    this.track();
    return this._value;
  }
  /**
   * 设置引用的值。
   *
   * 设置值时会：
   * 1. 比较新旧值是否发生变化
   * 2. 如果值发生变化，则：
   *    - 触发更新通知
   *    - 更新原始值
   *    - 更新响应式值
   *
   * @param v 要设置的新值
   */
  set value(v) {
    const oldValue = this._rawValue;
    const newValue = toRaw$1(v);
    if (!hasChanged$1(oldValue, newValue)) return;
    batchRun(() => {
      this.trigger();
      this._rawValue = newValue;
      this._value = toReactive$1(newValue);
    });
  }
}
let BaseReactiveHandler$1 = class BaseReactiveHandler {
  /**
   * 获取对象的属性值。
   *
   * 实现了以下功能：
   * 1. 响应式对象标识检查
   * 2. 原始对象获取
   * 3. 数组方法拦截
   * 4. 属性依赖追踪
   * 5. 值的自动解包
   * 6. 对象的自动响应式转换
   *
   * @param target 被代理的原始对象
   * @param key 要获取的属性名
   * @param receiver 代理对象本身
   * @returns 获取到的属性值
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
   *
   * 实现了以下功能：
   * 1. 值的原始化处理
   * 2. ref 值的特殊处理
   * 3. 属性变更通知
   * 4. 数组长度的特殊处理
   *
   * @param target 被代理的原始对象
   * @param key 要设置的属性名
   * @param value 要设置的新值
   * @param receiver 代理对象本身
   * @returns 设置是否成功
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
   * 实现了以下功能：
   * 1. 属性删除操作
   * 2. 删除后的变更通知
   *
   * @param target 被代理的原始对象
   * @param key 要删除的属性名
   * @returns 删除是否成功
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
  /**
   * 检查对象是否包含某个属性。
   *
   * 实现了以下功能：
   * 1. 属性存在性检查
   * 2. 属性访问依赖追踪
   *
   * @param target 被代理的原始对象
   * @param key 要检查的属性名
   * @returns 属性是否存在
   */
  has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol$1(key) || !builtInSymbols$1.has(key)) {
      PropertyReactivity.track(target, TrackOpTypes.HAS, key);
    }
    return result;
  }
  /**
   * 获取对象的所有属性名。
   *
   * 实现了以下功能：
   * 1. 属性遍历
   * 2. 遍历操作的依赖追踪
   *
   * @param target 被代理的原始对象
   * @returns 对象的所有属性名数组
   */
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
  if (!isSymbol$1(key)) key = String(key);
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
    /**
     * 获取 Map 中的值。
     *
     * 实现了以下功能：
     * 1. 支持原始键和响应式键的查找
     * 2. 自动追踪键的访问
     * 3. 自动将返回值转换为响应式
     *
     * @param key 要查找的键
     * @returns 找到的值，如果不存在则返回 undefined
     */
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
    /**
     * 获取集合的大小。
     *
     * 实现了以下功能：
     * 1. 追踪集合大小的访问
     * 2. 返回集合的实际大小
     */
    get size() {
      const target = this[ReactiveFlags.RAW];
      PropertyReactivity.track(toRaw$1(target), TrackOpTypes.ITERATE, ITERATE_KEY$1);
      return Reflect.get(target, "size", target);
    },
    /**
     * 检查集合是否包含某个值。
     *
     * 实现了以下功能：
     * 1. 支持原始键和响应式键的检查
     * 2. 自动追踪键的检查
     *
     * @param key 要检查的键
     * @returns 如果集合包含该键则返回 true，否则返回 false
     */
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
    /**
     * 遍历集合中的所有元素。
     *
     * 实现了以下功能：
     * 1. 追踪集合的遍历操作
     * 2. 自动将遍历的值转换为响应式
     * 3. 保持回调函数的 this 上下文
     *
     * @param callback 遍历回调函数
     * @param thisArg 回调函数的 this 值
     */
    forEach(callback, thisArg) {
      const observed = this;
      const target = observed[ReactiveFlags.RAW];
      const rawTarget = toRaw$1(target);
      const wrap = toReactive$1;
      PropertyReactivity.track(rawTarget, TrackOpTypes.ITERATE, ITERATE_KEY$1);
      return target.forEach(
        (value, key) => (
          // 重要：确保回调函数
          // 1. 使用响应式 map 作为 this 和第三个参数
          // 2. 接收到的值应该是相应的响应式/只读版本
          callback.call(thisArg, wrap(value), wrap(key), observed)
        )
      );
    },
    /**
     * 向 Set 中添加值。
     *
     * 实现了以下功能：
     * 1. 自动将值转换为原始值
     * 2. 避免重复添加
     * 3. 触发添加操作的通知
     *
     * @param value 要添加的值
     * @returns 集合本身，支持链式调用
     */
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
    /**
     * 设置 Map 中的值。
     *
     * 实现了以下功能：
     * 1. 自动将值转换为原始值
     * 2. 支持原始键和响应式键的设置
     * 3. 触发添加或修改操作的通知
     *
     * @param key 要设置的键
     * @param value 要设置的值
     * @returns 集合本身，支持链式调用
     */
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
    /**
     * 从集合中删除值。
     *
     * 实现了以下功能：
     * 1. 支持原始键和响应式键的删除
     * 2. 触发删除操作的通知
     *
     * @param key 要删除的键
     * @returns 如果删除成功则返回 true，否则返回 false
     */
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
    /**
     * 清空集合。
     *
     * 实现了以下功能：
     * 1. 清空集合中的所有元素
     * 2. 触发清空操作的通知
     * 3. 在开发模式下保存旧值用于调试
     *
     * @returns 如果清空成功则返回 true，否则返回 false
     */
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
      // 迭代器协议
      next() {
        const { value, done } = innerIterator.next();
        return done ? { value, done } : {
          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
          done
        };
      },
      // 可迭代协议
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
* @vue/shared v3.5.26
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
  const map = /* @__PURE__ */ Object.create(null);
  for (const key of str.split(",")) map[key] = 1;
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
* @vue/reactivity v3.5.26
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
      e.flags &= -9;
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
      e.flags &= -9;
      if (e.flags & 1) {
        try {
          ;
          e.trigger();
        } catch (err) {
          if (!error) error = err;
        }
      }
      e = next;
    }
  }
  if (error) throw error;
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
      if (link === tail) tail = prev;
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
  computed2.flags &= -17;
  if (computed2.globalVersion === globalVersion) {
    return;
  }
  computed2.globalVersion = globalVersion;
  if (!computed2.isSSR && computed2.flags & 128 && (!computed2.deps && !computed2._dirty || !isDirty(computed2))) {
    return;
  }
  computed2.flags |= 2;
  const dep = computed2.dep;
  const prevSub = activeSub;
  const prevShouldTrack = shouldTrack;
  activeSub = computed2;
  shouldTrack = true;
  try {
    prepareDeps(computed2);
    const value = computed2.fn(computed2._value);
    if (dep.version === 0 || hasChanged(value, computed2._value)) {
      computed2.flags |= 128;
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
    computed2.flags &= -3;
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
      dep.computed.flags &= -5;
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
  // TODO isolatedDeclarations "__v_skip"
  constructor(computed2) {
    this.computed = computed2;
    this.version = 0;
    this.activeLink = void 0;
    this.subs = void 0;
    this.map = void 0;
    this.key = void 0;
    this.sc = 0;
    this.__v_skip = true;
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
      if (false) ;
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
      if (currentTail) currentTail.nextSub = link;
    }
    link.dep.subs = link;
  }
}
const targetMap = /* @__PURE__ */ new WeakMap();
const ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
const MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
const ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol(
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
  if (raw === array) return raw;
  track(raw, "iterate", ARRAY_ITERATE_KEY);
  return isShallow(array) ? raw : raw.map(toReactive);
}
function shallowReadArray(arr) {
  track(arr = toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
  return arr;
}
function toWrapped(target, item) {
  if (isReadonly(target)) {
    return isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
  }
  return toReactive(item);
}
const arrayInstrumentations = {
  __proto__: null,
  [Symbol.iterator]() {
    return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
  },
  concat(...args) {
    return reactiveReadArray(this).concat(
      ...args.map((x) => isArray(x) ? reactiveReadArray(x) : x)
    );
  },
  entries() {
    return iterator(this, "entries", (value) => {
      value[1] = toWrapped(this, value[1]);
      return value;
    });
  },
  every(fn, thisArg) {
    return apply(this, "every", fn, thisArg, void 0, arguments);
  },
  filter(fn, thisArg) {
    return apply(
      this,
      "filter",
      fn,
      thisArg,
      (v) => v.map((item) => toWrapped(this, item)),
      arguments
    );
  },
  find(fn, thisArg) {
    return apply(
      this,
      "find",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findIndex(fn, thisArg) {
    return apply(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  findLast(fn, thisArg) {
    return apply(
      this,
      "findLast",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
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
  // keys() iterator only reads `length`, no optimization required
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
    return iterator(this, "values", (item) => toWrapped(this, item));
  }
};
function iterator(self, method, wrapValue) {
  const arr = shallowReadArray(self);
  const iter = arr[method]();
  if (arr !== self && !isShallow(self)) {
    iter._next = iter.next;
    iter.next = () => {
      const result = iter._next();
      if (!result.done) {
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
        return fn.call(this, toWrapped(self, item), index, self);
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
        return fn.call(this, acc, toWrapped(self, item), index, self);
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
  if (!isSymbol(key)) key = String(key);
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
    if (key === "__v_skip") return target["__v_skip"];
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
      const value = targetIsArray && isIntegerKey(key) ? res : res.value;
      return isReadonly2 && isObject(value) ? readonly(value) : value;
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
    const isArrayWithIntegerKey = isArray(target) && isIntegerKey(key);
    if (!this._isShallow) {
      const isOldValueReadonly = isReadonly(oldValue);
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue);
        value = toRaw(value);
      }
      if (!isArrayWithIntegerKey && isRef(oldValue) && !isRef(value)) {
        if (isOldValueReadonly) {
          return true;
        } else {
          oldValue.value = value;
          return true;
        }
      }
    }
    const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
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
      return target.size;
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
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(
    target,
    targetType === 2 ? collectionHandlers : baseHandlers
  );
  proxyMap.set(target, proxy);
  return proxy;
}
function isReactive(value) {
  if (isReadonly(value)) {
    return isReactive(value["__v_raw"]);
  }
  return !!(value && value["__v_isReactive"]);
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
const dependencies = { "@feng3d/reactivity": "1.0.6", "@vue/reactivity": "^3.5.14" };
const pkg = {
  dependencies
};
export {
  computed$1 as a,
  ref$1 as b,
  computed as c,
  pkg as p,
  ref as r
};
