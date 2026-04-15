/**
 * 版本对比工具模块
 *
 * 用于在测试中对比三个版本的性能：
 * - @feng3d/reactivity 优化前 (通过 @feng3d/reactivity-before 包)
 * - @feng3d/reactivity 优化后 (通过 @feng3d/reactivity workspace)
 * - @vue/reactivity 最新版本
 */

// 导入优化前版本 (npm 包 @feng3d/reactivity@1.0.11)
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
 * 运行测试多次并返回平均时间
 */
export function runMultipleTimes<T extends(...args: any[]) => { time: number; values?: any }>(
    testFn: T,
    times: number = 3,
    ...args: Parameters<T>
): ReturnType<T>
{
    const results: Array<{ time: number; values?: any }> = [];

    for (let i = 0; i < times; i++)
    {
        results.push(testFn(...args));
    }

    // 计算平均时间
    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;

    // 返回最后一次运行的结果，但使用平均时间
    const lastResult = results[results.length - 1];

    if (lastResult && typeof lastResult === 'object' && 'time' in lastResult)
    {
        lastResult.time = avgTime;
    }

    return lastResult as ReturnType<T>;
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
 * 更新表格显示所有信息（包括分析、一致性等）
 */
export function updateTableWithAllInfo(
    containerId: string,
    results: Array<{
        name: string;
        before: number;
        after: number;
        vue: number;
        improvement: string;
        analysis?: string;
        vueAnalysis?: string;
        consistency?: string;
    }>,
    _pkgDeps?: any,
)
{
    const container = document.getElementById(containerId);

    if (!container) return;

    // 添加 tooltip 样式
    const style = document.createElement('style');

    style.textContent = `
        .ratio-tooltip {
            position: relative;
            cursor: help;
            border-bottom: 1px dotted #888;
        }
        .ratio-tooltip:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
        }
    `;
    document.head.appendChild(style);

    let html = `
        <table class="summary-table">
            <thead>
                <tr>
                    <th>测试场景</th>
                    <th>@feng3d v1.0.11 (ms)</th>
                    <th>@feng3d 优化后 (ms)</th>
                    <th>@vue (ms)</th>
                    <th>结论</th>
                    <th>结果一致性</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(result =>
    {
        // 计算相对于 Vue 的比率（如果时间为 0 则使用 1）
        const beforeValue = result.before || 1;
        const afterValue = result.after || 1;
        const vueValue = result.vue || 1;
        const beforeRatio = (beforeValue / vueValue).toFixed(2);
        const afterRatio = (afterValue / vueValue).toFixed(2);
        // 计算性能倍率：快时显示倍数，慢时显示时间比
        const beforePerfRatio = beforeValue < vueValue ? (vueValue / beforeValue).toFixed(2) : beforeRatio;
        const afterPerfRatio = afterValue < vueValue ? (vueValue / afterValue).toFixed(2) : afterRatio;
        const vueRatio = '1.00';

        // 计算优化效果
        const improvement = ((beforeValue - afterValue) / beforeValue) * 100;
        const improvementText = improvement > 0
            ? `↑${improvement.toFixed(1)}%`
            : improvement < 0
                ? `↓${Math.abs(improvement).toFixed(1)}%`
                : '→0%';

        // 根据性能选择颜色
        let afterColorClass = '';

        if (parseFloat(afterRatio) < 1)
        {
            afterColorClass = 'color: #4CAF50;'; // 比 Vue 快，绿色
        }
        else if (parseFloat(afterRatio) > 1.2)
        {
            afterColorClass = 'color: #f44336;'; // 比 Vue 慢很多，红色
        }

        // 生成结论
        let conclusion = '';
        const afterRatioNum = parseFloat(afterRatio);
        const afterPerfRatioNum = parseFloat(afterPerfRatio);
        const improvementNum = improvement;

        // 生成 vsVue 描述和颜色
        let vsVueDesc = '';
        let vsVueColor = '';

        if (afterRatioNum < 1)
        {
            // 比 Vue 快
            if (afterPerfRatioNum >= 2)
            {
                vsVueDesc = `比 @vue 快 ${afterPerfRatioNum.toFixed(1)} 倍`;
            }
            else
            {
                // 如果差距不大，用百分比
                const percentFaster = ((1 - afterRatioNum) * 100);

                vsVueDesc = `比 @vue 快 ${percentFaster.toFixed(1)}%`;
            }
            vsVueColor = 'color: #4CAF50;'; // 绿色
        }
        else if (afterRatioNum > 1)
        {
            // 比 Vue 慢
            const percentSlower = ((afterRatioNum - 1) * 100);

            if (afterPerfRatioNum >= 2)
            {
                vsVueDesc = `比 @vue 慢 ${afterPerfRatioNum.toFixed(1)} 倍`;
            }
            else
            {
                vsVueDesc = `比 @vue 慢 ${percentSlower.toFixed(1)}%`;
            }
            if (afterRatioNum <= 1.5)
            {
                vsVueColor = 'color: #FF9800;'; // 橙色
            }
            else
            {
                vsVueColor = 'color: #f44336;'; // 红色
            }
        }
        else
        {
            vsVueDesc = '与 @vue 持平';
            vsVueColor = 'color: #888;'; // 灰色
        }

        // 生成优化效果描述和颜色
        const improvementDesc = improvementNum > 0
            ? `提升 ${improvementNum.toFixed(1)}%`
            : improvementNum < 0
                ? `下降 ${Math.abs(improvementNum).toFixed(1)}%`
                : '持平';

        let improvementColor = '';

        if (improvementNum > 0)
        {
            improvementColor = 'color: #4CAF50;'; // 提升是好的，绿色
        }
        else if (improvementNum < 0)
        {
            improvementColor = 'color: #f44336;'; // 下降不好，红色
        }
        else
        {
            improvementColor = 'color: #888;'; // 持平，灰色
        }

        conclusion = `<span style="${vsVueColor}">${vsVueDesc}</span>，<span style="${improvementColor}">相对 v1.0.11 ${improvementDesc}</span>`;

        html += `
            <tr>
                <td><strong>${result.name}</strong></td>
                <td>${result.before.toFixed(2)} <span class="ratio-tooltip" data-tooltip="相对 @vue 的性能倍率" style="color: #888;">(${beforePerfRatio}x)</span></td>
                <td>
                    ${result.after.toFixed(2)}
                    <span class="ratio-tooltip" data-tooltip="相对 @vue 的性能倍率，${parseFloat(afterRatio) < 1 ? '比 @vue 快' : '比 @vue 慢'}" style="${afterColorClass}"> (${afterPerfRatio}x)</span>
                    <span class="ratio-tooltip" data-tooltip="相对 v1.0.11 的优化效果" style="${improvement > 0 ? 'color: #4CAF50;' : improvement < 0 ? 'color: #f44336;' : 'color: #888;'}; margin-left: 4px;">${improvementText}</span>
                </td>
                <td>${result.vue.toFixed(2)} <span class="ratio-tooltip" data-tooltip="基准倍率" style="color: #888;">(${vueRatio}x)</span></td>
                <td style="font-size: 12px;">${conclusion}</td>
                <td style="font-size: 12px;">${result.consistency || '-'}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * 更新结果显示三列对比（简化版，仅显示时间）
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
                    <th>@vue (ms)</th>
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

        // 计算相对于 Vue 的比率
        const beforeRatio = result.vue > 0 ? (result.feng3dBefore / result.vue).toFixed(2) : 'N/A';
        const afterRatio = result.vue > 0 ? (result.feng3dAfter / result.vue).toFixed(2) : 'N/A';
        const vueRatio = '1.00';

        html += `
            <tr>
                <td><strong>${result.name}</strong></td>
                <td>${result.feng3dBefore.toFixed(2)} <span style="color: #888;">(${beforeRatio}x)</span></td>
                <td>${result.feng3dAfter.toFixed(2)} <span style="color: #888;">(${afterRatio}x)</span></td>
                <td>${result.vue.toFixed(2)} <span style="color: #888;">(${vueRatio}x)</span></td>
                <td class="${improvementClass}">${improvementText}</td>
                <td class="${vsVueClass}">${vsVueText}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}
