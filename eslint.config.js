import common from 'eslint-config-neon/common';
import typescript from 'eslint-config-neon/typescript';
import prettier from 'eslint-config-neon/prettier';
import node from 'eslint-config-neon/node';
import merge from 'lodash.merge';

/**
 * @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray}
 */
const config = [
	...[...node, ...common, ...typescript, ...prettier].map(config =>
		merge(config, {
			files: ['src/**/*.ts'],
			languageOptions: {
				parserOptions: {
					project: 'tsconfig.eslint.json',
				},
			},
		}),
	),
];

export default config;
