import { reactive } from "./reactive";
import { isRef } from "./ref";
import { TrackOpTypes } from "./shared/constants";
import { isArray, isIntegerKey, isObject, Target } from "./shared/general";
import { track } from "./track";

class BaseReactiveHandler implements ProxyHandler<Target>
{
    get(target: Target, key: string | symbol, receiver: object): any
    {
        const targetIsArray = isArray(target)

        const res = Reflect.get(
            target,
            key,
            // if this is a proxy wrapping a ref, return methods using the raw ref
            // as receiver so that we don't have to call `toRaw` on the ref in all
            // its class methods
            isRef(target) ? target : receiver,
        )

        //
        track(target, TrackOpTypes.GET, key)

        if (isRef(res))
        {
            // ref unwrapping - skip unwrap for Array + integer key.
            return targetIsArray && isIntegerKey(key) ? res : res.value
        }

        if (isObject(res))
        {
            // Convert returned value into a proxy as well. we do the isObject check
            // here to avoid invalid value warning. Also need to lazy access readonly
            // and reactive here to avoid circular dependency.
            return reactive(res)
        }

        return res
    }
}

class MutableReactiveHandler extends BaseReactiveHandler
{

}

export const mutableHandlers: ProxyHandler<object> = new MutableReactiveHandler()

