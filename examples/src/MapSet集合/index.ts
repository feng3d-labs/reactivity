import { reactive } from '@feng3d/reactivity';
import { reactive as beforeReactive } from '@feng3d/reactivity-before';
import { reactive as vueReactive } from '@vue/reactivity';
import { map迭代 } from './MapSet集合';
import { updateTableWithAllInfo } from '../tool';
import pkg from '../../package.json';

const count = 1000;
const runs = 3;

const feng3dResults: Array<{ time: number; values: number[] }> = [];
const feng3dBeforeResults: Array<{ time: number; values: number[] }> = [];
const vueResults: Array<{ time: number; values: number[] }> = [];

for (let i = 0; i < runs; i++)
{
    feng3dResults.push(map迭代(reactive as any, count));
    feng3dBeforeResults.push(map迭代(beforeReactive as any, count));
    vueResults.push(map迭代(vueReactive as any, count));
}

const avgFeng3d = feng3dResults.reduce((sum, r) => sum + r.time, 0) / runs;
const avgFeng3dBefore = feng3dBeforeResults.reduce((sum, r) => sum + r.time, 0) / runs;
const avgVue = vueResults.reduce((sum, r) => sum + r.time, 0) / runs;
const resultsMatch = JSON.stringify(feng3dResults[0].values) === JSON.stringify(vueResults[0].values);

document.getElementById('test-code')!.textContent = `map迭代(reactive, ${count}); // 运行 ${runs} 次\n\n` + map迭代.toString();

const tableData: Array<{
    name: string;
    before: number;
    after: number;
    vue: number;
    improvement: string;
    consistency: string;
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
        name: `Map 迭代 (第 ${i + 1} 次)`,
        before: feng3dBeforeResults[i].time,
        after: feng3dResults[i].time,
        vue: vueResults[i].time,
        improvement: improvementText,
        consistency: `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ✅`,
    });
}

const avgImprovement = ((avgFeng3dBefore - avgFeng3d) / avgFeng3dBefore) * 100;
const avgImprovementText = avgImprovement > 0
    ? `提升 ${avgImprovement.toFixed(1)}%`
    : avgImprovement < 0
        ? `下降 ${Math.abs(avgImprovement).toFixed(1)}%`
        : '持平';

tableData.push({
    name: 'Map 迭代 (平均)',
    before: avgFeng3dBefore,
    after: avgFeng3d,
    vue: avgVue,
    improvement: avgImprovementText,
    consistency: `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ✅`,
});

updateTableWithAllInfo('three-column-results', tableData, pkg.dependencies);
