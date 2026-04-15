// 格式化数组显示，超过10个元素时只显示首尾
function formatArray(values: any[]): string
{
    if (values.length <= 10)
    {
        return values.join(', ');
    }

    const first = values.slice(0, 5).join(', ');
    const last = values.slice(-5).join(', ');

    return `${first}, ... (${values.length - 10} more), ..., ${last}`;
}

// 更新结果展示
export function updateResults(result: {
    code: string;
    feng3dResult: {
        time: any;
        values: any[];
    };
    vueResult: {
        time: any;
        values: any[];
    };
    结论?: { feng3d: string, vue: string, feng3dBefore?: string };
})
{
    let { code, feng3dResult, vueResult, 结论 } = result;

    const testCodeElement = document.getElementById('test-code');

    testCodeElement!.textContent = code;

    document.getElementById('feng3d-time')!.textContent = feng3dResult.time;
    document.getElementById('feng3d-values')!.textContent = formatArray(feng3dResult.values);

    document.getElementById('vue-time')!.textContent = vueResult.time;
    document.getElementById('vue-values')!.textContent = formatArray(vueResult.values);
    document.getElementById('feng3d-分析')!.textContent = 结论?.feng3d ?? '未提供';
    document.getElementById('vue-分析')!.textContent = 结论?.vue ?? '未提供';
}
