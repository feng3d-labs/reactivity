import { ref, effect } from '@feng3d/reactivity';
import { ref as beforeRef, effect as beforeEffect } from '@feng3d/reactivity-before';
import { ref as vueRef, effect as vueEffect } from '@vue/reactivity';
import { 多effect追踪 } from './effect追踪';
import { updateTableWithAllInfo } from '../tool';
import pkg from '../../package.json';

const count = 1000;
const runs = 3;

// 运行三版本测试，运行3次
const feng3dResults: Array<{ time: number; values: number[] }> = [];
const feng3dBeforeResults: Array<{ time: number; values: number[] }> = [];
const vueResults: Array<{ time: number; values: number[] }> = [];

for (let i = 0; i < runs; i++)
{
    feng3dResults.push(多effect追踪(ref, effect, count));
    feng3dBeforeResults.push(多effect追踪(beforeRef, beforeEffect, count));
    vueResults.push(多effect追踪(vueRef, vueEffect, count));
}

// 计算平均值
const avgFeng3d = feng3dResults.reduce((sum, r) => sum + r.time, 0) / runs;
const avgFeng3dBefore = feng3dBeforeResults.reduce((sum, r) => sum + r.time, 0) / runs;
const avgVue = vueResults.reduce((sum, r) => sum + r.time, 0) / runs;

// 验证结果一致性
const resultsMatch = JSON.stringify(feng3dResults[0].values) === JSON.stringify(vueResults[0].values);

// 显示测试代码
document.getElementById('test-code')!.textContent = `多effect追踪(ref, effect, ${count}); // 运行 ${runs} 次\n\n` + 多effect追踪.toString();

// 生成三列对比表格（包含所有信息）
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
        name: `Effect 创建和执行 (第 ${i + 1} 次)`,
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
    name: 'Effect 创建和执行 (平均)',
    before: avgFeng3dBefore,
    after: avgFeng3d,
    vue: avgVue,
    improvement: avgImprovementText,
    consistency: `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ✅`,
});

updateTableWithAllInfo('three-column-results', tableData, pkg.dependencies);
