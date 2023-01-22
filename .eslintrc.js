module.exports = {
    extends: ['@luchio/eslint-config-base-ts'],
    env: {
        mocha: true,
        node: true,
    },
    rules: {
        'import/no-extraneous-dependencies': 'off',
    },
};
