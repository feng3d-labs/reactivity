import { ref, batchRun } from '@feng3d/reactivity';
import { ref as beforeRef, batchRun as beforeBatchRun } from '@feng3d/reactivity-before';
import { ref as vueRef } from '@vue/reactivity';
import { 批量Ref更新 } from './批量更新';
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
    feng3dResults.push(批量Ref更新(ref, batchRun, count));
    feng3dBeforeResults.push(批量Ref更新(beforeRef, beforeBatchRun, count));
    vueResults.push(批量Ref更新(vueRef, undefined, count));
}

// 计算平均值
const avgFeng3d = feng3dResults.reduce((sum, r) => sum + r.time, 0) / runs;
const avgFeng3dBefore = feng3dBeforeResults.reduce((sum, r) => sum + r.time, 0) / runs;
const avgVue = vueResults.reduce((sum, r) => sum + r.time, 0) / runs;

// 验证结果一致性
const resultsMatch = JSON.stringify(feng3dResults[0].values) === JSON.stringify(vueResults[0].values);

// 显示测试代码
document.getElementById('test-code')!.textContent = `批量Ref更新(ref, batchRun, ${count}); // 运行 ${runs} 次\n\n` + 批量Ref更新.toString();

const tableData: Array<{
    name: string;
    before: number;
    after: number;
    vue: number;
    improvement: string;
    consistency: string;
}> = [];

// 添加三次运行的结果
for (let i = 0; i < runs; i++)
{
    const improvement = ((feng3dBeforeResults[i].time - feng3dResults[i].time) / feng3dBeforeResults[i].time) * 100;
    const improvementText = improvement > 0
        ? `提升 ${improvement.toFixed(1)}%`
        : improvement < 0
            ? `下降 ${Math.abs(improvement).toFixed(1)}%`
            : '持平';

    tableData.push({
        name: `批量 Ref 更新 (第 ${i + 1} 次)`,
        before: feng3dBeforeResults[i].time,
        after: feng3dResults[i].time,
        vue: vueResults[i].time,
        improvement: improvementText,
        consistency: `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ✅`,
    });
}

// 添加平均值行
const avgImprovement = ((avgFeng3dBefore - avgFeng3d) / avgFeng3dBefore) * 100;
const avgImprovementText = avgImprovement > 0
    ? `提升 ${avgImprovement.toFixed(1)}%`
    : avgImprovement < 0
        ? `下降 ${Math.abs(avgImprovement).toFixed(1)}%`
        : '持平';

tableData.push({
    name: '批量 Ref 更新 (平均)',
    before: avgFeng3dBefore,
    after: avgFeng3d,
    vue: avgVue,
    improvement: avgImprovementText,
    consistency: `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ✅`,
});

updateTableWithAllInfo('three-column-results', tableData, pkg.dependencies);
