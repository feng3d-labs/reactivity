import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/lib/**',
            '**/public/**',
            '**/coverage/**',
            '**/.git/**',
            '**/examples/node_modules/**',
            '**/examples/dist/**',
            '**/examples/public/**',
        ],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                global: false,
            },
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-prototype-builtins': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unsafe-declaration-merging': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            'prefer-const': 'off',

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
            'quotes': ['warn', 'single', {
                'avoidEscape': true,
                'allowTemplateLiterals': true,
            }],
            'semi': ['warn', 'always'],
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
);