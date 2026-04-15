import { reactive } from '@feng3d/reactivity';
import { reactive as vueReactive } from '@vue/reactivity';
import { updateResults } from './tool';
import { map迭代 } from './MapSet集合';
import pkg from '../../package.json';

const count = 1000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@${pkg.dependencies['@feng3d/reactivity']}`;
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行 Map 迭代测试
updateResults({
    code: `map迭代(reactive, ${count});\n\n` + map迭代.toString(),
    feng3dResult: map迭代(reactive as any, count),
    vueResult: map迭代(vueReactive as any, count),
    结论: {
        feng3d: '迭代器返回原始值，无包装开销。',
        vue: '迭代器需要创建响应式包装。',
    },
});
