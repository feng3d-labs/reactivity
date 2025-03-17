import { effect, reactive } from "@vue/reactivity";

interface Link {
    value?: { val?: number },
    next?: Link
}

const link: Link = {
    // value: { val: 1 },
}

function getValue(link: Link) {
    if (link.value?.val !== undefined || !link.next)
        return link.value?.val;

    return getValue(link.next);
}

effect(() => {
    const value = getValue(reactive(link));
    console.log(value);
})

delete reactive(link).value?.val;
reactive(link).next = { next: { value: { val: 2 } } };
reactive(link).next = null;
reactive(link).next = { next: { value: { val: 2 } } };