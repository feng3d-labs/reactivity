import { computed, ref } from '@feng3d/reactivity';
import { computed as beforeComputed, ref as beforeRef } from '@feng3d/reactivity-before';
import { computed as vueComputed, ref as vueRef } from '@vue/reactivity';
import { 数组Computed } from './数组操作';
import { updateTableWithAllInfo } from '../tool';
import pkg from '../../package.json';

const count = 10000;
const runs = 3;

// 运行三版本测试，运行3次
const feng3dResults: Array<{ time: number; values: number[] }> = [];
const feng3dBeforeResults: Array<{ time: number; values: number[] }> = [];
const vueResults: Array<{ time: number; values: number[] }> = [];

for (let i = 0; i < runs; i++)
{
    feng3dResults.push(数组Computed(ref, computed, count));
    feng3dBeforeResults.push(数组Computed(beforeRef, beforeComputed, count));
    vueResults.push(数组Computed(vueRef, vueComputed, count));
}

const avgFeng3d = feng3dResults.reduce((sum, r) => sum + r.time, 0) / runs;
const avgFeng3dBefore = feng3dBeforeResults.reduce((sum, r) => sum + r.time, 0) / runs;
const avgVue = vueResults.reduce((sum, r) => sum + r.time, 0) / runs;
const resultsMatch = JSON.stringify(feng3dResults[0].values) === JSON.stringify(vueResults[0].values);

document.getElementById('test-code')!.textContent = `数组Computed(ref, computed, ${count}); // 运行 ${runs} 次\n\n` + 数组Computed.toString();

const tableData: Array<{
    name: string;
    before: number;
    after: number;
    vue: number;
    improvement: string;
    consistency: string;
    isConsistent: boolean;
}> = [];

for (let i = 0; i < runs; i++)
{
    const improvement = ((feng3dBeforeResults[i].time - feng3dResults[i].time) / feng3dBeforeResults[i].time) * 100;
    const improvementText = improvement > 0
        ? `提升 ${improvement.toFixed(1)}%`
        : improvement < 0
            ? `下降 ${Math.abs(improvement).toFixed(1)}%`
            : '持平';

    tableData.push({
        name: `数组 Computed 求和 (第 ${i + 1} 次)`,
        before: feng3dBeforeResults[i].time,
        after: feng3dResults[i].time,
        vue: vueResults[i].time,
        improvement: improvementText,
        consistency: `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ${resultsMatch ? '✅' : '❌'}`,
        isConsistent: resultsMatch,
    });
}

const avgImprovement = ((avgFeng3dBefore - avgFeng3d) / avgFeng3dBefore) * 100;
const avgImprovementText = avgImprovement > 0
    ? `提升 ${avgImprovement.toFixed(1)}%`
    : avgImprovement < 0
        ? `下降 ${Math.abs(avgImprovement).toFixed(1)}%`
        : '持平';

tableData.push({
    name: '数组 Computed 求和 (平均)',
    before: avgFeng3dBefore,
    after: avgFeng3d,
    vue: avgVue,
    improvement: avgImprovementText,
    consistency: `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ${resultsMatch ? '✅' : '❌'}`,
    isConsistent: resultsMatch,
});

updateTableWithAllInfo('three-column-results', tableData, pkg.dependencies);
