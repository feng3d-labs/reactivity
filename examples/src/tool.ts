/**
 * 版本对比工具模块
 *
 * 用于在测试中对比三个版本的性能：
 * - @feng3d/reactivity 优化前 (通过 @feng3d/reactivity-before 包)
 * - @feng3d/reactivity 优化后 (通过 @feng3d/reactivity workspace)
 * - @vue/reactivity 最新版本
 */

// 导入优化前版本 (npm 包 @feng3d/reactivity@1.0.12)
import { ref as beforeRef, computed as beforeComputed, reactive as beforeReactive, effect as beforeEffect, batchRun as beforeBatchRun } from '@feng3d/reactivity-before';

/**
 * 运行优化前版本的测试
 */
export function runBeforeTest(testFn: (ref: any, computed: any, reactive: any, effect: any, batchRun: any) => number): number
{
    try
    {
        return testFn(beforeRef, beforeComputed, beforeReactive, beforeEffect, beforeBatchRun);
    }
    catch (e)
    {
        console.error('Error running before test:', e);

        return 0;
    }
}

/**
 * 生成三列对比结果
 */
export function generateThreeColumnResult(
    testName: string,
    feng3dBefore: number,
    feng3dAfter: number,
    vueTime: number,
)
{
    const feng3dImprovement = calculateImprovement(feng3dBefore, feng3dAfter);
    const feng3dVsVue = calculateImprovement(vueTime, feng3dAfter);

    return {
        name: testName,
        feng3dBefore,
        feng3dAfter,
        vue: vueTime,
        feng3dImprovement,
        feng3dVsVue,
    };
}

/**
 * 计算性能改进百分比
 */
function calculateImprovement(before: number, after: number): number
{
    if (before === 0) return 0;

    return ((before - after) / before) * 100;
}

/**
 * 更新结果显示三列对比
 */
export function updateThreeColumnResults(
    containerId: string,
    results: ReturnType<typeof generateThreeColumnResult>[],
)
{
    const container = document.getElementById(containerId);

    if (!container) return;

    let html = `
        <table class="summary-table">
            <thead>
                <tr>
                    <th>测试场景</th>
                    <th>@feng3d 优化前 (ms)</th>
                    <th>@feng3d 优化后 (ms)</th>
                    <th>@vue/reactivity (ms)</th>
                    <th>优化效果</th>
                    <th>vs Vue</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(result =>
    {
        const improvementClass = result.feng3dImprovement > 1 ? 'improved' : result.feng3dImprovement < -1 ? 'regression' : 'neutral';
        const vsVueClass = result.feng3dVsVue > 1 ? 'improved' : result.feng3dVsVue < -1 ? 'regression' : 'neutral';
        const improvementText = result.feng3dImprovement > 0
            ? `↓ ${result.feng3dImprovement.toFixed(1)}%`
            : result.feng3dImprovement < 0
                ? `↑ ${Math.abs(result.feng3dImprovement).toFixed(1)}%`
                : '→ 0%';
        const vsVueText = result.feng3dVsVue > 0
            ? `↓ ${result.feng3dVsVue.toFixed(1)}%`
            : result.feng3dVsVue < 0
                ? `↑ ${Math.abs(result.feng3dVsVue).toFixed(1)}%`
                : '→ 0%';

        html += `
            <tr>
                <td><strong>${result.name}</strong></td>
                <td>${result.feng3dBefore.toFixed(2)}</td>
                <td>${result.feng3dAfter.toFixed(2)}</td>
                <td>${result.vue.toFixed(2)}</td>
                <td class="${improvementClass}">${improvementText}</td>
                <td class="${vsVueClass}">${vsVueText}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}
