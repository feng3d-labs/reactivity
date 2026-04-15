import { ref, computed, reactive, effect, batchRun } from '@feng3d/reactivity';
import { ref as vueRef, computed as vueComputed, reactive as vueReactive, effect as vueEffect } from '@vue/reactivity';
import pkg from '../../package.json';

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@${pkg.dependencies['@feng3d/reactivity']}`;
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行性能测试的辅助函数
function runTest(name: string, testFn: () => { feng3d: number; vue: number })
{
    try
    {
        const result = testFn();
        const speedup = result.vue / result.feng3d;
        const winner = speedup > 1 ? 'feng3d' : speedup < 1 ? 'vue' : 'tie';

        return { name, ...result, speedup, winner };
    }
    catch (e)
    {
        console.error(`Error running test ${name}:`, e);

        return { name, feng3d: 0, vue: 0, speedup: 1, winner: 'error' };
    }
}

// 定义所有测试
const tests = [
    {
        category: '基础操作',
        tests: [
            {
                name: 'Ref 创建和访问',
                test: () =>
                {
                    const count = 100000;
                    const start1 = performance.now();

                    for (let i = 0; i < count; i++) ref(i).value;
                    const feng3d = performance.now() - start1;

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++) vueRef(i).value;
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
            {
                name: 'Computed 计算缓存',
                test: () =>
                {
                    const count = 10000;
                    const a = ref(1);
                    const b = ref(2);
                    const c = computed(() => a.value + b.value);

                    c.value;

                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        a.value = i;
                        c.value;
                    }
                    const feng3d = performance.now() - start1;

                    const a2 = vueRef(1);
                    const b2 = vueRef(2);
                    const c2 = vueComputed(() => a2.value + b2.value);

                    c2.value;

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        a2.value = i;
                        c2.value;
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
            {
                name: '嵌套 Computed (10层)',
                test: () =>
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

                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        a.value = i;
                        current.value;
                    }
                    const feng3d = performance.now() - start1;

                    const a2 = vueRef(1);
                    let current2 = vueComputed(() => a2.value * 2);

                    for (let i = 0; i < 9; i++)
                    {
                        const prev = current2;

                        current2 = vueComputed(() => prev.value + 1);
                    }
                    current2.value;

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        a2.value = i;
                        current2.value;
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
        ],
    },
    {
        category: '数组操作',
        tests: [
            {
                name: '大数组读取 (10000 元素)',
                test: () =>
                {
                    const count = 1000;
                    const arr = new Array(10000).fill(0).map((_, i) => ref(i));

                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        for (let j = 0; j < arr.length; j++) arr[j].value;
                    }
                    const feng3d = performance.now() - start1;

                    const arr2 = new Array(10000).fill(0).map((_, i) => vueRef(i));

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        for (let j = 0; j < arr2.length; j++) arr2[j].value;
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
            {
                name: '数组 Computed 求和',
                test: () =>
                {
                    const count = 10000;
                    const arr = new Array(1000).fill(0).map(() => ref(0));
                    const sum = computed(() => arr.reduce((acc, r) => acc + r.value, 0));

                    sum.value;

                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        arr[i % 1000].value++;
                        sum.value;
                    }
                    const feng3d = performance.now() - start1;

                    const arr2 = new Array(1000).fill(0).map(() => vueRef(0));
                    const sum2 = vueComputed(() => arr2.reduce((acc, r) => acc + r.value, 0));

                    sum2.value;

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        arr2[i % 1000].value++;
                        sum2.value;
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
        ],
    },
    {
        category: '嵌套对象',
        tests: [
            {
                name: '深层嵌套读取 (10层)',
                test: () =>
                {
                    const count = 10000;
                    let obj: any = { value: 0 };

                    for (let i = 0; i < 9; i++) obj = { next: obj };
                    const reactiveObj = reactive(obj);

                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        let current = reactiveObj;

                        while (current.next) current = current.next;
                    }
                    const feng3d = performance.now() - start1;

                    let obj2: any = { value: 0 };

                    for (let i = 0; i < 9; i++) obj2 = { next: obj2 };
                    const reactiveObj2 = vueReactive(obj2);

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        let current = reactiveObj2;

                        while (current.next) current = current.next;
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
            {
                name: '宽对象更新 (1000 属性)',
                test: () =>
                {
                    const count = 10000;
                    const obj: any = {};

                    for (let i = 0; i < 1000; i++) obj[`prop${i}`] = i;
                    const reactiveObj = reactive(obj);

                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        reactiveObj[`prop${i % 1000}`] = i;
                    }
                    const feng3d = performance.now() - start1;

                    const obj2: any = {};

                    for (let i = 0; i < 1000; i++) obj2[`prop${i}`] = i;
                    const reactiveObj2 = vueReactive(obj2);

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        reactiveObj2[`prop${i % 1000}`] = i;
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
        ],
    },
    {
        category: 'Effect 追踪',
        tests: [
            {
                name: 'Effect 创建和执行',
                test: () =>
                {
                    const count = 1000;
                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        const a = ref(i);

                        effect(() =>
                        {
                            a.value;
                        });
                    }
                    const feng3d = performance.now() - start1;

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        const a = vueRef(i);

                        vueEffect(() =>
                        {
                            a.value;
                        });
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
        ],
    },
    {
        category: '批量更新',
        tests: [
            {
                name: '批量 Ref 更新 (100 个)',
                test: () =>
                {
                    const count = 10000;
                    const refs = new Array(100).fill(0).map((_, i) => ref(i));

                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        batchRun(() =>
                        {
                            for (let j = 0; j < refs.length; j++) refs[j].value = i + j;
                        });
                    }
                    const feng3d = performance.now() - start1;

                    const refs2 = new Array(100).fill(0).map((_, i) => vueRef(i));

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        // Vue 3 默认有批处理，直接更新
                        for (let j = 0; j < refs2.length; j++) refs2[j].value = i + j;
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
        ],
    },
    {
        category: 'Map/Set 集合',
        tests: [
            {
                name: 'Map 迭代 (100 元素)',
                test: () =>
                {
                    const count = 10000;
                    const map = reactive(new Map<number, number>());

                    for (let i = 0; i < 100; i++) map.set(i, i);

                    const start1 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        for (const [k, v] of map) k + v;
                    }
                    const feng3d = performance.now() - start1;

                    const map2 = vueReactive(new Map<number, number>());

                    for (let i = 0; i < 100; i++) map2.set(i, i);

                    const start2 = performance.now();

                    for (let i = 0; i < count; i++)
                    {
                        for (const [k, v] of map2) k + v;
                    }
                    const vue = performance.now() - start2;

                    return { feng3d, vue };
                },
            },
        ],
    },
    {
        category: '极端场景',
        tests: [
            {
                name: '复杂情况取值 (递归 16 层)',
                test: () =>
                {
                    const count = 1000;

                    function runTest(refFn: any, computedFn: any)
                    {
                        const b = refFn(2);

                        function 递归(depth = 10)
                        {
                            if (depth <= 0) return computedFn(() => b.value).value;

                            return computedFn(() =>
                            {
                                return 递归(depth - 1) + 递归(depth - 2);
                            }).value;
                        }

                        const cb = computedFn(() => 递归(16));

                        b.value++;
                        cb.value;

                        const start = performance.now();

                        for (let i = 0; i < count; i++)
                        {
                            refFn(1).value++;
                            cb.value;
                        }

                        return performance.now() - start;
                    }

                    const feng3d = runTest(ref, computed);
                    const vue = runTest(vueRef, vueComputed);

                    return { feng3d, vue };
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
        const result = runTest(`${category.category}: ${test.name}`, test.test);

        (result as any).category = category.category;
        allResults.push(result);
    });
});

// 计算总体统计
const feng3dWins = allResults.filter(r => r.winner === 'feng3d').length;
const vueWins = allResults.filter(r => r.winner === 'vue').length;
const ties = allResults.filter(r => r.winner === 'tie').length;
const avgSpeedup = allResults.reduce((acc, r) => acc + r.speedup, 0) / allResults.length;
const maxSpeedup = Math.max(...allResults.map(r => r.speedup));

// 显示总体统计
const statsContainer = document.getElementById('overall-stats')!;

statsContainer.innerHTML = `
    <div class="stat-card">
        <div class="stat-value">${allResults.length}</div>
        <div class="stat-label">测试场景总数</div>
    </div>
    <div class="stat-card">
        <div class="stat-value" style="color: #4CAF50;">${feng3dWins}</div>
        <div class="stat-label">@feng3d 获胜</div>
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
        <div class="stat-label">平均加速倍数</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">${maxSpeedup.toFixed(1)}x</div>
        <div class="stat-label">最大加速倍数</div>
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
                <th class="category-header" colspan="5">${category.category}</th>
            </tr>
            <tr>
                <th>测试场景</th>
                <th>@feng3d (ms)</th>
                <th>@vue (ms)</th>
                <th>速度倍数</th>
                <th>获胜者</th>
            </tr>
        </thead>
        <tbody>
    `;

    category.tests.forEach(test =>
    {
        const result = runTest(`${category.category}: ${test.name}`, test.test);
        const speedupClass = result.speedup > 1 ? 'faster' : result.speedup < 1 ? 'slower' : 'neutral';
        const winnerClass = result.winner === 'feng3d' ? 'winner-feng3d' : result.winner === 'vue' ? 'winner-vue' : 'neutral';
        const winnerText = result.winner === 'feng3d' ? '@feng3d' : result.winner === 'vue' ? '@vue' : '平局';
        const barWidth = Math.min(100, (result.speedup / (maxSpeedup || 1)) * 100);

        html += `
            <tr>
                <td>${test.name}</td>
                <td>${result.feng3d.toFixed(2)}</td>
                <td>${result.vue.toFixed(2)}</td>
                <td class="${speedupClass}">
                    ${result.speedup.toFixed(2)}x
                    <span class="speed-indicator">
                        <span class="speed-bar" style="width: ${barWidth}%"></span>
                    </span>
                </td>
                <td><span class="winner-badge ${winnerClass}">${winnerText}</span></td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;
    tablesContainer.appendChild(table);
});
