import { ref, batchRun } from '@feng3d/reactivity';
import { ref as beforeRef, batchRun as beforeBatchRun } from '@feng3d/reactivity-before';
import { ref as vueRef } from '@vue/reactivity';
import { updateResults } from './tool';
import { 批量Ref更新 } from './批量更新';
import { generateThreeColumnResult, updateThreeColumnResults } from '../tool';
import pkg from '../../package.json';

const count = 10000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = ` (当前版本)`;
document.getElementById('feng3d-before-version')!.textContent = ' (v1.0.11)';
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行三版本测试
const feng3dResult = 批量Ref更新(ref, batchRun, count);
const feng3dBeforeResult = 批量Ref更新(beforeRef, beforeBatchRun, count);
const vueResult = 批量Ref更新(vueRef, undefined, count);

// 更新详细结果
updateResults({
    code: `批量Ref更新(ref, batchRun, ${count});\n\n` + 批量Ref更新.toString(),
    feng3dResult,
    vueResult,
    结论: {
        feng3d: '批处理使用栈管理，避免重复的依赖通知。',
        vue: 'Vue 3 默认有批处理优化，但 @feng3d 的批处理更精细。',
    },
});

// 更新优化前的结果
document.getElementById('feng3d-before-time')!.textContent = feng3dBeforeResult.time.toFixed(2);
document.getElementById('feng3d-before-values')!.textContent = feng3dBeforeResult.values.join(', ');

// 计算优化效果
const improvement = ((feng3dBeforeResult.time - feng3dResult.time) / feng3dBeforeResult.time) * 100;
const improvementText = improvement > 0
    ? `性能提升 ${improvement.toFixed(1)}% ↓`
    : improvement < 0
        ? `性能下降 ${Math.abs(improvement).toFixed(1)}% ↑`
        : '性能基本持平 →';

document.getElementById('optimization-分析')!.textContent = improvementText;

// 更新优化前的分析
document.getElementById('feng3d-before-分析')!.textContent =
    '批处理使用栈管理，避免重复的依赖通知（v1.0.11）';

// 生成三列对比表格
const threeColumnResults = [
    generateThreeColumnResult(
        '批量 Ref 更新',
        feng3dBeforeResult.time,
        feng3dResult.time,
        vueResult.time,
    ),
];

updateThreeColumnResults('three-column-results', threeColumnResults);
