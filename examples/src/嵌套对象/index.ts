import { reactive, computed } from '@feng3d/reactivity';
import { reactive as beforeReactive, computed as beforeComputed } from '@feng3d/reactivity-before';
import { reactive as vueReactive, computed as vueComputed } from '@vue/reactivity';
import { updateResults } from './tool';
import { 嵌套对象Computed } from './嵌套对象';
import { generateThreeColumnResult, updateThreeColumnResults } from '../tool';
import pkg from '../../package.json';

const count = 10000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = ` (当前版本)`;
document.getElementById('feng3d-before-version')!.textContent = ' (v1.0.11)';
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行三版本测试
const feng3dResult = 嵌套对象Computed(reactive as any, computed as any, count);
const feng3dBeforeResult = 嵌套对象Computed(beforeReactive as any, beforeComputed as any, count);
const vueResult = 嵌套对象Computed(vueReactive as any, vueComputed as any, count);

// 验证结果一致性
const resultsMatch = JSON.stringify(feng3dResult.values) === JSON.stringify(vueResult.values);
const beforeMatch = JSON.stringify(feng3dBeforeResult.values) === JSON.stringify(vueResult.values);

// 更新详细结果
updateResults({
    code: `嵌套对象Computed(reactive, computed, ${count});\n\n` + 嵌套对象Computed.toString(),
    feng3dResult,
    vueResult,
    结论: {
        feng3d: '脏标记只影响变化的路径。',
        vue: '深层访问需要遍历所有层级的版本号。',
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
    '脏标记只影响变化的路径（v1.0.11）';

// 更新 feng3d 分析
document.getElementById('feng3d-分析')!.textContent =
    '脏标记只影响变化的路径。';

// 更新 vue 分析
document.getElementById('vue-分析')!.textContent =
    '深层访问需要遍历所有层级的版本号。';

// 生成三列对比表格
const threeColumnResults = [
    generateThreeColumnResult(
        '嵌套对象 Computed',
        feng3dBeforeResult.time,
        feng3dResult.time,
        vueResult.time,
    ),
];

updateThreeColumnResults('three-column-results', threeColumnResults);
