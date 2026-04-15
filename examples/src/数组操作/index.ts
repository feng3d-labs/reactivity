import { computed, ref } from '@feng3d/reactivity';
import { computed as vueComputed, ref as vueRef } from '@vue/reactivity';
import { updateResults } from './tool';
import { 数组Computed } from './数组操作';
import pkg from '../../package.json';

const count = 10000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@${pkg.dependencies['@feng3d/reactivity']}`;
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行数组 Computed 测试
updateResults({
    code: `数组Computed(ref, computed, ${count});\n\n` + 数组Computed.toString(),
    feng3dResult: 数组Computed(ref, computed, count),
    vueResult: 数组Computed(vueRef, vueComputed, count),
    结论: {
        feng3d: '脏标记机制，只有变化的元素触发重算。',
        vue: '版本号检查，每次访问需要遍历所有依赖。',
    },
});
