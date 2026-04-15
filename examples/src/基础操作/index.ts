import { ref } from '@feng3d/reactivity';
import { ref as beforeRef } from '@feng3d/reactivity-before';
import { ref as vueRef } from '@vue/reactivity';
import { updateResults } from './tool';
import { 基础Ref操作 } from './基础操作';
import { generateThreeColumnResult, updateThreeColumnResults } from '../tool';
import pkg from '../../package.json';

const count = 100000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = ` (当前版本)`;
document.getElementById('feng3d-before-version')!.textContent = ' (v1.0.11)';
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行三版本测试
const feng3dResult = 基础Ref操作(ref, count);
const feng3dBeforeResult = 基础Ref操作(beforeRef, count);
const vueResult = 基础Ref操作(vueRef, count);

// 更新详细结果
updateResults({
    code: `基础Ref操作(ref, ${count});\n\n` + 基础Ref操作.toString(),
    feng3dResult,
    vueResult,
    结论: {
        feng3d: '直接操作 ref.value，无额外开销。',
        vue: '使用 Proxy 包装 ref 对象，每次访问需要经过代理层。',
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
    '直接操作 ref.value，无额外开销（v1.0.11）';

// 生成三列对比表格
const threeColumnResults = [
    generateThreeColumnResult(
        'Ref 创建和访问',
        feng3dBeforeResult.time,
        feng3dResult.time,
        vueResult.time,
    ),
];

updateThreeColumnResults('three-column-results', threeColumnResults);
