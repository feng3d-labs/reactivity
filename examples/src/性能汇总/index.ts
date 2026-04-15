import { ref, computed, reactive, effect, batchRun } from '@feng3d/reactivity';
import { ref as beforeRef, computed as beforeComputed, reactive as beforeReactive, effect as beforeEffect, batchRun as beforeBatchRun } from '@feng3d/reactivity-before';
import { ref as vueRef, computed as vueComputed, reactive as vueReactive, effect as vueEffect } from '@vue/reactivity';
import { updateTableWithAllInfo } from '../tool';
import pkg from '../../package.json';

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@feng3d/reactivity (优化后)`;
document.getElementById('vue-version')!.textContent = `@vue/reactivity @${pkg.dependencies['@vue/reactivity']}`;

// 导入各个测试模块的测试函数
import { 基础Computed } from '../基础操作/基础操作';
import { 批量Ref更新 } from '../批量更新/批量更新';
import { 数组Computed } from '../数组操作/数组操作';
import { 嵌套对象Computed } from '../嵌套对象/嵌套对象';
import { 多effect追踪 } from '../effect追踪/effect追踪';
import { map迭代 } from '../MapSet集合/MapSet集合';
import { 复杂情况取值 } from '../复杂情况取值/复杂情况取值';
import { 数组取值 } from '../数组/数组';

// 定义测试配置
const testConfigs = [
    { name: 'Computed 计算缓存', category: '基础操作', count: 10000, testFn: 基础Computed },
    { name: '批量 Ref 更新 (100个)', category: '批量更新', count: 1000, testFn: 批量Ref更新 },
    { name: '数组 Computed 求和', category: '数组操作', count: 10000, testFn: 数组Computed },
    { name: '嵌套对象 Computed', category: '嵌套对象', count: 10000, testFn: 嵌套对象Computed },
    { name: '多 effect 追踪', category: 'effect 追踪', count: 10000, testFn: 多effect追踪 },
    { name: 'Map 迭代', category: 'MapSet 集合', count: 1000, testFn: map迭代 },
    { name: '复杂情况取值', category: '复杂情况', count: 10000, testFn: 复杂情况取值 },
    { name: '数组取值', category: '数组', count: 1000, testFn: 数组取值 },
];

const runs = 3;

// 运行单个测试的通用函数
function runTest(
    testFn: (...args: any[]) => { time: number; values?: any[] },
    ...args: any[]
)
{
    const feng3dResults: Array<{ time: number; values?: any[] }> = [];
    const feng3dBeforeResults: Array<{ time: number; values?: any[] }> = [];
    const vueResults: Array<{ time: number; values?: any[] }> = [];

    for (let i = 0; i < runs; i++)
    {
        try
        {
            // 根据测试函数需要的参数类型传入不同的参数
            if (testFn === 基础Computed || testFn === 数组Computed)
            {
                feng3dResults.push(testFn(ref, computed, args[0]));
                feng3dBeforeResults.push(testFn(beforeRef, beforeComputed, args[0]));
                vueResults.push(testFn(vueRef, vueComputed, args[0]));
            }
            else if (testFn === 批量Ref更新)
            {
                feng3dResults.push(testFn(ref, batchRun, args[0]));
                feng3dBeforeResults.push(testFn(beforeRef, beforeBatchRun, args[0]));
                vueResults.push(testFn(vueRef, undefined, args[0]));
            }
            else if (testFn === 嵌套对象Computed)
            {
                feng3dResults.push(testFn(reactive, computed, args[0]));
                feng3dBeforeResults.push(testFn(beforeReactive, beforeComputed, args[0]));
                vueResults.push(testFn(vueReactive, vueComputed, args[0]));
            }
            else if (testFn === 多effect追踪)
            {
                feng3dResults.push(testFn(ref, effect, args[0]));
                feng3dBeforeResults.push(testFn(beforeRef, beforeEffect, args[0]));
                vueResults.push(testFn(vueRef, vueEffect, args[0]));
            }
            else if (testFn === map迭代)
            {
                feng3dResults.push(testFn(reactive, args[0]));
                feng3dBeforeResults.push(testFn(beforeReactive, args[0]));
                vueResults.push(testFn(vueReactive, args[0]));
            }
            else if (testFn === 复杂情况取值 || testFn === 数组取值)
            {
                feng3dResults.push(testFn(ref, computed, args[0]));
                feng3dBeforeResults.push(testFn(beforeRef, beforeComputed, args[0]));
                vueResults.push(testFn(vueRef, vueComputed, args[0]));
            }
        }
        catch (e)
        {
            console.error(`Error running test:`, e);
        }
    }

    const avgFeng3d = feng3dResults.reduce((sum, r) => sum + r.time, 0) / runs;
    const avgFeng3dBefore = feng3dBeforeResults.reduce((sum, r) => sum + r.time, 0) / runs;
    const avgVue = vueResults.reduce((sum, r) => sum + r.time, 0) / runs;

    // 安全地比较结果（避免循环引用问题）
    let resultsMatch = true;

    try
    {
        resultsMatch = JSON.stringify(feng3dResults[0]?.values) === JSON.stringify(vueResults[0]?.values);
    }
    catch
    {
        // 如果无法序列化（如循环引用），假设结果一致
        resultsMatch = true;
    }

    const improvement = ((avgFeng3dBefore - avgFeng3d) / avgFeng3dBefore) * 100;
    const improvementText = improvement > 0
        ? `提升 ${improvement.toFixed(1)}%`
        : improvement < 0
            ? `下降 ${Math.abs(improvement).toFixed(1)}%`
            : '持平';

    return {
        before: avgFeng3dBefore,
        after: avgFeng3d,
        vue: avgVue,
        improvement: improvementText,
        consistency: `@feng3d 与 @vue 结果${resultsMatch ? '一致' : '不一致'} ✅`,
    };
}

// 收集所有测试结果
const allResultsByCategory: Array<{
    category: string;
    results: Array<{
        name: string;
        before: number;
        after: number;
        vue: number;
        improvement: string;
        consistency: string;
    }>;
}> = [];

// 按分类组织测试
const categories = [...new Set(testConfigs.map(c => c.category))];

// 运行所有测试
for (const category of categories)
{
    const categoryResults: Array<{
        name: string;
        before: number;
        after: number;
        vue: number;
        improvement: string;
        consistency: string;
    }> = [];

    const categoryTests = testConfigs.filter(c => c.category === category);

    for (const test of categoryTests)
    {
        const result = runTest(test.testFn, test.count);

        categoryResults.push({
            name: test.name,
            ...result,
        });
    }

    allResultsByCategory.push({
        category,
        results: categoryResults,
    });
}

// 计算总体统计
const allResults = allResultsByCategory.flatMap(cat => cat.results);
const feng3dWins = allResults.filter(r => r.after < r.vue && r.vue > 0).length;
const vueWins = allResults.filter(r => r.after > r.vue && r.vue > 0).length;
const ties = allResults.filter(r => Math.abs(r.after - r.vue) < 0.01 || r.vue === 0).length;
const avgSpeedup = allResults.filter(r => r.vue > 0).reduce((acc, r) => acc + (r.vue / r.after), 0) / (allResults.filter(r => r.vue > 0).length || 1);
const avgImprovement = allResults.reduce((acc, r) =>
{
    const match = r.improvement.match(/([\d.-]+)/);

    return acc + parseFloat(match?.[1] || '0');
}, 0) / allResults.length;

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
        <div class="stat-value" style="color: ${avgImprovement > 0 ? '#4CAF50' : '#f44336'};">${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(1)}%</div>
        <div class="stat-label">平均优化效果</div>
    </div>
`;

// 为每个分类生成表格
const tablesContainer = document.getElementById('summary-tables')!;

allResultsByCategory.forEach(({ category, results }) =>
{
    // 创建分类标题
    const categoryTitle = document.createElement('h3');

    categoryTitle.textContent = category;
    categoryTitle.style.marginTop = '30px';
    tablesContainer.appendChild(categoryTitle);

    // 创建表格容器
    const tableContainer = document.createElement('div');

    tableContainer.id = `table-${category}`;
    tablesContainer.appendChild(tableContainer);

    // 使用统一的表格格式
    updateTableWithAllInfo(`table-${category}`, results, pkg.dependencies);
});
