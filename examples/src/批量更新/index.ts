import { ref, batchRun } from '@feng3d/reactivity';
import { ref as vueRef } from '@vue/reactivity';
import { updateResults } from './tool';
import { 批量Ref更新 } from './批量更新';
import pkg from '../../package.json';

const count = 10000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@${pkg.dependencies['@feng3d/reactivity']}`;
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行批量 Ref 更新测试
updateResults({
    code: `批量Ref更新(ref, batchRun, ${count});\n\n` + 批量Ref更新.toString(),
    feng3dResult: 批量Ref更新(ref, batchRun, count),
    vueResult: 批量Ref更新(vueRef, undefined, count),
    结论: {
        feng3d: '批处理使用栈管理，避免重复的依赖通知。',
        vue: 'Vue 3 默认有批处理优化，但 @feng3d 的批处理更精细。',
    },
});
