import { computed, ref } from '@feng3d/reactivity';
import { computed as beforeComputed, ref as beforeRef } from '@feng3d/reactivity-before';
import { computed as vueComputed, ref as vueRef } from '@vue/reactivity';
import { updateResults } from './tool';
import { 复杂情况取值 } from './复杂情况取值';
import { generateThreeColumnResult, updateThreeColumnResults } from '../tool';
import pkg from '../../package.json';

const count = 10000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = ` (当前版本)`;
document.getElementById('feng3d-before-version')!.textContent = ' (v1.0.11)';
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行三版本测试
const feng3dResult = 复杂情况取值(ref, computed, count);
const feng3dBeforeResult = 复杂情况取值(beforeRef, beforeComputed, count);
const vueResult = 复杂情况取值(vueRef, vueComputed, count);

// 验证结果一致性
const resultsMatch = JSON.stringify(feng3dResult.values) === JSON.stringify(vueResult.values);
const beforeMatch = JSON.stringify(feng3dBeforeResult.values) === JSON.stringify(vueResult.values);

// 更新详细结果
updateResults({
    code: `复杂情况取值(ref, computed, ${count});\n\n` + 复杂情况取值.toString(),
    feng3dResult,
    vueResult,
    结论: {
        feng3d: `自下而上的使用脏标记进行维护状态，当发生变化时只会冒泡一次到父节点。结果与 @vue${resultsMatch ? '一致' : '不一致'} ✅`,
        feng3dBefore: `自下而上的使用脏标记进行维护状态（v1.0.11）。结果与 @vue${beforeMatch ? '一致' : '不一致'} ✅`,
        vue: '自上而下的使用版本号进行维护状态，每次取值都会遍历整个树。',
    },
});

// 更新优化前的结果
document.getElementById('feng3d-before-time')!.textContent = feng3dBeforeResult.time.toFixed(2);

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
    '自下而上的使用脏标记进行维护状态（v1.0.11）';

// 更新 feng3d 分析
document.getElementById('feng3d-分析')!.textContent =
    `自下而上的使用脏标记进行维护状态。结果与 @vue${resultsMatch ? '一致' : '不一致'} ✅`;

// 更新 vue 分析
document.getElementById('vue-分析')!.textContent =
    '自上而下的使用版本号进行维护状态，每次取值都会遍历整个树。';

// 生成三列对比表格
const threeColumnResults = [
    generateThreeColumnResult(
        '复杂情况取值 (递归 16 层)',
        feng3dBeforeResult.time,
        feng3dResult.time,
        vueResult.time,
    ),
];

updateThreeColumnResults('three-column-results', threeColumnResults);
