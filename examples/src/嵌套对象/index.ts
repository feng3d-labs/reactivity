import { reactive, computed } from '@feng3d/reactivity';
import { reactive as vueReactive, computed as vueComputed } from '@vue/reactivity';
import { updateResults } from './tool';
import { 嵌套对象Computed } from './嵌套对象';
import pkg from '../../package.json';

const count = 10000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@${pkg.dependencies['@feng3d/reactivity']}`;
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行嵌套对象 Computed 测试
updateResults({
    code: `嵌套对象Computed(reactive, computed, ${count});\n\n` + 嵌套对象Computed.toString(),
    feng3dResult: 嵌套对象Computed(reactive as any, computed as any, count),
    vueResult: 嵌套对象Computed(vueReactive as any, vueComputed as any, count),
    结论: {
        feng3d: '脏标记只影响变化的路径。',
        vue: '深层访问需要遍历所有层级的版本号。',
    },
});
