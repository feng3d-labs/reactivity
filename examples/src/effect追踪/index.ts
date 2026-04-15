import { ref, effect } from '@feng3d/reactivity';
import { ref as vueRef, effect as vueEffect } from '@vue/reactivity';
import { updateResults } from './tool';
import { 多effect追踪 } from './effect追踪';
import pkg from '../../package.json';

const count = 1000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@${pkg.dependencies['@feng3d/reactivity']}`;
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 运行多 effect 追踪测试
updateResults({
    code: `多effect追踪(ref, effect, ${count});\n\n` + 多effect追踪.toString(),
    feng3dResult: 多effect追踪(ref, effect, count),
    vueResult: 多effect追踪(vueRef, vueEffect, count),
    结论: {
        feng3d: '依赖通知使用 Set，高效去重。',
        vue: '依赖通知使用 Set，但需要额外的版本管理。',
    },
});
