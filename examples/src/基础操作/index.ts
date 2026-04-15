import { ref } from '@feng3d/reactivity';
import { ref as vueRef } from '@vue/reactivity';
import { updateResults } from './tool';
import { 基础Ref操作 } from './基础操作';
import pkg from '../../package.json';

const count = 100000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@${pkg.dependencies['@feng3d/reactivity']}`;
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行基础 Ref 操作测试
updateResults({
    code: `基础Ref操作(ref, ${count});\n\n` + 基础Ref操作.toString(),
    feng3dResult: 基础Ref操作(ref, count),
    vueResult: 基础Ref操作(vueRef, count),
    结论: {
        feng3d: '直接操作 ref.value，无额外开销。',
        vue: '使用 Proxy 包装 ref 对象，每次访问需要经过代理层。',
    },
});
