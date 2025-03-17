import { computed, ComputedRef, effect, reactive, ref } from "@vue/reactivity";

let _gpuRenderPipelineDescriptor = {} as any;
const renderPipeline = {} as any;

const updateVertex = computed(() => {
    console.log(0);
    //
    reactive(renderPipeline).vertex

    //
    _gpuRenderPipelineDescriptor.vertex = renderPipeline.vertex;

    // 
    _gpuRenderPipelineDescriptor.dirty = true;
});

const updateFragment = computed(() => {
    console.log(1);

    reactive(renderPipeline).fragment

    //
    _gpuRenderPipelineDescriptor.fragment = renderPipeline.fragment;

    // 
    _gpuRenderPipelineDescriptor.dirty = true;
});

const result = computed(() => {
    console.log(2);

    updateVertex.value;
    updateFragment.value;

    return _gpuRenderPipelineDescriptor;
});

function getResult() {
    if (result.value.dirty) {
        console.log(`version`, _gpuRenderPipelineDescriptor.version);
        result.value.dirty = false;
        result["_"] = Math.random();
    }
    return result["_"];
}

console.log(result.value);
// console.log(`version`, _gpuRenderPipelineDescriptor.version);

reactive(renderPipeline).vertex = 1;

reactive(renderPipeline).vertex = 1;
console.log(getResult());

reactive(renderPipeline).fragment = 1;
console.log(getResult());
reactive(renderPipeline).fragment = 1;
console.log(getResult());

// reactive(renderPipeline).vertex = 2;
// console.log(create.value);
// reactive(renderPipeline).vertex = 3;
// console.log(create.value);
// console.log(create.value);
// reactive(renderPipeline).fragment = 2;
// // console.log(create.value);
// reactive(renderPipeline).fragment = 2;
// console.log(create.value);
// console.log(`version`,_gpuRenderPipelineDescriptor.version);
// console.log(gpuRenderPipelineDescriptor.value);
// reactive(renderPipeline).fragment = 3;
// console.log(gpuRenderPipelineDescriptor.value);