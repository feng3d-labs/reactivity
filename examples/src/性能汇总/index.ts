import { ref, computed, reactive, effect, batchRun } from '@feng3d/reactivity';
import { ref as beforeRef, computed as beforeComputed, reactive as beforeReactive, effect as beforeEffect, batchRun as beforeBatchRun } from '@feng3d/reactivity-before';
import { ref as vueRef, computed as vueComputed, reactive as vueReactive, effect as vueEffect } from '@vue/reactivity';
import { generateThreeColumnResult } from '../tool';
import pkg from '../../package.json';

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@feng3d/reactivity (优化后)`;
document.getElementById('vue-version')!.textContent = `@vue/reactivity @${pkg.dependencies['@vue/reactivity']}`;

// 运行性能测试的辅助函数
function runThreeVersionTest(
    name: string,
    testFn: (ref: any, computed: any, reactive: any, effect: any, batchRun: any) => { time: number },
)
{
    try
    {
        const feng3dResult = testFn(ref, computed, reactive, effect, batchRun);
        const feng3dBeforeResult = testFn(beforeRef, beforeComputed, beforeReactive, beforeEffect, beforeBatchRun);
        const vueResult = testFn(vueRef, vueComputed, vueReactive, vueEffect, undefined);

        const speedup = vueResult.time / feng3dResult.time;
        const winner = speedup > 1 ? 'feng3d' : speedup < 1 ? 'vue' : 'tie';

        return {
            name,
            feng3dBefore: feng3dBeforeResult.time,
            feng3dAfter: feng3dResult.time,
            vue: vueResult.time,
            feng3dImprovement: ((feng3dBeforeResult.time - feng3dResult.time) / feng3dBeforeResult.time) * 100,
            feng3dVsVue: ((vueResult.time - feng3dResult.time) / vueResult.time) * 100,
            speedup,
            winner,
        };
    }
    catch (e)
    {
        console.error(`Error running test ${name}:`, e);

        return { name, feng3dBefore: 0, feng3dAfter: 0, vue: 0, speedup: 1, winner: 'error' };
    }
}

// 定义所有测试
const tests = [
    {
        category: '基础操作',
        tests: [
            {
                name: 'Ref 创建和访问',
                test: (ref: any) =>
                {
                    const count = 100000;
                    const start = performance.now();

                    for (let i = 0; i < count; i++) ref(i).value;

                    return { time: performance.now() - start };
                },
            },
            {
                name: 'Computed 计算缓存',
                test: (ref: any, computed: any) =>
                {
                    const count = 10000;
                    const a = ref(1);
                    const b = ref(2);
                    const c = computed(() => a.value + b.value);

                    c.value;

                    const start = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        a.value = i;
                        c.value;
                    }

                    return { time: performance.now() - start };
                },
            },
            {
                name: '嵌套 Computed (10层)',
                test: (ref: any, computed: any) =>
                {
                    const count = 10000;
                    const a = ref(1);
                    let current = computed(() => a.value * 2);

                    for (let i = 0; i < 9; i++)
                    {
                        const prev = current;

                        current = computed(() => prev.value + 1);
                    }
                    current.value;

                    const start = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        a.value = i;
                        current.value;
                    }

                    return { time: performance.now() - start };
                },
            },
        ],
    },
    {
        category: '批量更新',
        tests: [
            {
                name: '批量 Ref 更新 (100 个)',
                test: (ref: any, _computed: any, _reactive: any, _effect: any, batchRun: any) =>
                {
                    const count = 10000;
                    const refs = new Array(100).fill(0).map((_, i) => ref(i));
                    const start = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        if (batchRun)
                        {
                            batchRun(() =>
                            {
                                for (let j = 0; j < refs.length; j++) refs[j].value = i + j;
                            });
                        }
                        else
                        {
                            for (let j = 0; j < refs.length; j++) refs[j].value = i + j;
                        }
                    }

                    return { time: performance.now() - start };
                },
            },
        ],
    },
];

// 运行所有测试
const allResults: any[] = [];

tests.forEach(category =>
{
    category.tests.forEach(test =>
    {
        const result = runThreeVersionTest(`${category.category}: ${test.name}`, test.test);

        (result as any).category = category.category;
        allResults.push(result);
    });
});

// 计算总体统计
const feng3dWins = allResults.filter(r => r.winner === 'feng3d').length;
const vueWins = allResults.filter(r => r.winner === 'vue').length;
const ties = allResults.filter(r => r.winner === 'tie').length;
const avgSpeedup = allResults.reduce((acc, r) => acc + r.speedup, 0) / allResults.length;
const avgImprovement = allResults.reduce((acc, r) => acc + r.feng3dImprovement, 0) / allResults.length;

// 显示总体统计
const statsContainer = document.getElementById('overall-stats')!;

statsContainer.innerHTML = `
    <div class="stat-card">
        <div class="stat-value">${allResults.length}</div>
        <div class="stat-label">测试场景总数</div>
    </div>
    <div class="stat-card">
        <div class="stat-value" style="color: #4CAF50;">${feng3dWins}</div>
        <div class="stat-label">@feng3d 获胜 (vs Vue)</div>
    </div>
    <div class="stat-card">
        <div class="stat-value" style="color: #2196F3;">${vueWins}</div>
        <div class="stat-label">@Vue 获胜</div>
    </div>
    <div class="stat-card">
        <div class="stat-value" style="color: #9E9E9E;">${ties}</div>
        <div class="stat-label">平局</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">${avgSpeedup.toFixed(2)}x</div>
        <div class="stat-label">平均加速倍数 (vs Vue)</div>
    </div>
    <div class="stat-card">
        <div class="stat-value" style="color: ${avgImprovement > 0 ? '#4CAF50' : '#f44336'};">${avgImprovement.toFixed(1)}%</div>
        <div class="stat-label">平均优化效果</div>
    </div>
`;

// 生成详细表格
const tablesContainer = document.getElementById('summary-tables')!;

tests.forEach(category =>
{
    const table = document.createElement('table');

    table.className = 'summary-table';

    let html = `
        <thead>
            <tr>
                <th class="category-header" colspan="6">${category.category}</th>
            </tr>
            <tr>
                <th>测试场景</th>
                <th>@feng3d v1.0.11 (ms)</th>
                <th>@feng3d 优化后 (ms)</th>
                <th>@vue (ms)</th>
                <th>优化效果</th>
                <th>vs Vue</th>
            </tr>
        </thead>
        <tbody>
    `;

    category.tests.forEach(test =>
    {
        const result = allResults.find(r => r.name === test.name)!;

        const improvementClass = result.feng3dImprovement > 1 ? 'improved'
            : result.feng3dImprovement < -1 ? 'regression' : 'neutral';
        const improvementText = result.feng3dImprovement > 0
            ? `↓ ${result.feng3dImprovement.toFixed(1)}%`
            : result.feng3dImprovement < 0
                ? `↑ ${Math.abs(result.feng3dImprovement).toFixed(1)}%`
                : '→ 0%';

        const speedupClass = result.speedup > 1 ? 'faster' : result.speedup < 1 ? 'slower' : 'neutral';
        const winnerClass = result.winner === 'feng3d' ? 'winner-feng3d' : result.winner === 'vue' ? 'winner-vue' : 'neutral';
        const winnerText = result.winner === 'feng3d' ? '@feng3d' : result.winner === 'vue' ? '@vue' : '平局';

        html += `
            <tr>
                <td>${test.name}</td>
                <td>${result.feng3dBefore.toFixed(2)}</td>
                <td>${result.feng3dAfter.toFixed(2)}</td>
                <td>${result.vue.toFixed(2)}</td>
                <td class="${improvementClass}">${improvementText}</td>
                <td class="${speedupClass}">${result.speedup.toFixed(2)}x <span class="winner-badge ${winnerClass}">${winnerText}</span></td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;
    tablesContainer.appendChild(table);
});
