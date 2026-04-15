import { ref, effect } from '@feng3d/reactivity';
import { ref as beforeRef, effect as beforeEffect } from '@feng3d/reactivity-before';
import { ref as vueRef, effect as vueEffect } from '@vue/reactivity';
import { updateResults } from './tool';
import { 多effect追踪 } from './effect追踪';
import { generateThreeColumnResult, updateThreeColumnResults } from '../tool';
import pkg from '../../package.json';

const count = 1000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = ` (当前版本)`;
document.getElementById('feng3d-before-version')!.textContent = ' (v1.0.11)';
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行三版本测试
const feng3dResult = 多effect追踪(ref, effect, count);
const feng3dBeforeResult = 多effect追踪(beforeRef, beforeEffect, count);
const vueResult = 多effect追踪(vueRef, vueEffect, count);

// 验证结果一致性
const resultsMatch = JSON.stringify(feng3dResult.values) === JSON.stringify(vueResult.values);
const beforeMatch = JSON.stringify(feng3dBeforeResult.values) === JSON.stringify(vueResult.values);

// 更新详细结果
updateResults({
    code: `多effect追踪(ref, effect, ${count});\n\n` + 多effect追踪.toString(),
    feng3dResult,
    vueResult,
    结论: {
        feng3d: '依赖通知使用 Set，高效去重。',
        vue: '依赖通知使用 Set，但需要额外的版本管理。',
    },
});

// 计算优化效果
const improvement = ((feng3dBeforeResult.time - feng3dResult.time) / feng3dBeforeResult.time) * 100;
const improvementText = improvement > 0
    ? `性能提升 ${improvement.toFixed(1)}% ↓`
    : improvement < 0
        ? `性能下降 ${Math.abs(improvement).toFixed(1)}% ↑`
        : '性能基本持平 →';

document.getElementById('optimization-分析')!.textContent = improvementText;
document.getElementById('result-一致性')!.textContent =
    `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ✅，@feng3d (v1.0.11) 与 @vue 结果${beforeMatch ? '一致' : '不一致'} ✅`;

// 更新优化前的分析
document.getElementById('feng3d-before-分析')!.textContent =
    '依赖通知使用 Set，高效去重（v1.0.11）';

// 更新 feng3d 分析
document.getElementById('feng3d-分析')!.textContent =
    '依赖通知使用 Set，高效去重。';

// 更新 vue 分析
document.getElementById('vue-分析')!.textContent =
    '依赖通知使用 Set，但需要额外的版本管理。';

// 生成三列对比表格
const threeColumnResults = [
    generateThreeColumnResult(
        'Effect 创建和执行',
        feng3dBeforeResult.time,
        feng3dResult.time,
        vueResult.time,
    ),
];

updateThreeColumnResults('three-column-results', threeColumnResults);
