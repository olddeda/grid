module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jquery: true,
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
  extends: [
    '@nuxtjs',
    'prettier',
    'prettier/vue',
    'plugin:prettier/recommended',
    'plugin:nuxt/recommended',
  ],
  plugins: ['prettier'],
  rules: {
    'no-empty': 1,
    'no-unused-vars': 1,
    'no-unreachable': 1,
    'no-prototype-builtins': 0,
    'vue/no-v-html': 0,
  },
}
