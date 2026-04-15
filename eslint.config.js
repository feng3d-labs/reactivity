// 导入 TypeScript ESLint 配置
import tseslint from 'typescript-eslint';
// 导入全局变量定义
import globals from 'globals';

// 导出 ESLint 配置
export default [
    // 忽略检查的文件和目录
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/lib/**',
            '**/public/**',
            '**/coverage/**',
            '**/.git/**',
        ],
    },
    // 使用 TypeScript ESLint 推荐配置
    ...tseslint.configs.recommended,
    {
        // 语言选项配置
        languageOptions: {
            // 全局变量配置
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                global: false,
            },
            // 解析器选项
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // ESLint 推荐规则（手动选择需要的）
            'no-cond-assign': 'error',
            'no-constant-condition': 'warn',
            'no-duplicate-case': 'error',
            'no-empty': ['warn', { allowEmptyCatch: true }],
            'no-ex-assign': 'error',
            'no-extra-boolean-cast': 'error',
            'no-func-assign': 'error',
            'no-inner-declarations': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'error',
            'no-obj-calls': 'error',
            'no-prototype-builtins': 'off',
            'no-regex-spaces': 'error',
            'no-setter-return': 'error',
            'no-sparse-arrays': 'off',
            'no-this-before-super': 'off',
            'no-undef': 'off',
            'no-unexpected-multiline': 'error',
            'no-unreachable': 'warn',
            'no-unsafe-finally': 'error',
            'no-unsafe-negation': 'error',
            'valid-typeof': 'error',

            // TypeScript ESLint 规则覆盖
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unsafe-declaration-merging': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-redundant-type-const-assert': 'off',

            // 其他规则
            'prefer-const': 'off',
            'no-fallthrough': 'off',
            'no-constant-binary-expression': 'off',

            // 注释格式规则
            'spaced-comment': ['warn', 'always', {
                'line': {
                    'markers': ['/'],
                    'exceptions': ['-', '+'],
                },
                'block': {
                    'markers': ['!'],
                    'exceptions': ['*'],
                    'balanced': true,
                },
            }],

            // 空格和换行规则
            'no-trailing-spaces': ['warn', {
                'skipBlankLines': false,
                'ignoreComments': false,
            }],
            'no-multiple-empty-lines': ['warn', {
                'max': 1,
                'maxEOF': 1,
                'maxBOF': 0,
            }],
            'lines-between-class-members': ['warn', 'always', {
                'exceptAfterSingleLine': true,
            }],
            'padding-line-between-statements': [
                'warn',
                { 'blankLine': 'always', 'prev': '*', 'next': 'return' },
                { 'blankLine': 'always', 'prev': ['const', 'let', 'var'], 'next': '*' },
                { 'blankLine': 'any', 'prev': ['const', 'let', 'var'], 'next': ['const', 'let', 'var'] },
            ],

            // 缩进规则
            'indent': ['warn', 4, {
                'SwitchCase': 1,
                'VariableDeclarator': 'first',
                'outerIIFEBody': 1,
                'MemberExpression': 1,
                'FunctionDeclaration': {
                    'parameters': 1,
                    'body': 1,
                },
                'FunctionExpression': {
                    'parameters': 1,
                    'body': 1,
                },
                'CallExpression': {
                    'arguments': 1,
                },
                'ArrayExpression': 1,
                'ObjectExpression': 1,
                'ImportDeclaration': 1,
                'flatTernaryExpressions': false,
                'ignoreComments': false,
            }],

            // 引号规则
            'quotes': ['warn', 'single', {
                'avoidEscape': true,
                'allowTemplateLiterals': true,
            }],

            // 其他格式规则
            'semi': ['off'],
            'comma-dangle': ['warn', 'always-multiline'],
            'object-curly-spacing': ['warn', 'always'],
            'array-bracket-spacing': ['warn', 'never'],
            'arrow-spacing': ['warn', {
                'before': true,
                'after': true,
            }],
            'block-spacing': ['warn', 'always'],
            'brace-style': ['warn', 'allman', {
                'allowSingleLine': false,
            }],
            'comma-spacing': ['warn', {
                'before': false,
                'after': true,
            }],
            'comma-style': ['warn', 'last'],
            'key-spacing': ['warn', {
                'beforeColon': false,
                'afterColon': true,
            }],
            'keyword-spacing': ['warn', {
                'before': true,
                'after': true,
            }],
            'space-before-blocks': ['warn', 'always'],
            'space-before-function-paren': ['warn', {
                'anonymous': 'always',
                'named': 'never',
                'asyncArrow': 'always',
            }],
            'space-in-parens': ['warn', 'never'],
            'space-infix-ops': ['warn'],
            'space-unary-ops': ['warn', {
                'words': true,
                'nonwords': false,
            }],
        },
    },
];
