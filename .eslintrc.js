module.exports = {
    parser: "@babel/eslint-parser",
    parserOptions: {
      requireConfigFile: false, // Allows parsing without a Babel config
      ecmaVersion: 2021,        // Supports modern ECMAScript features
      sourceType: "module",     // Enables `import` and `export`
      ecmaFeatures: {
        jsx: true,              // Enables JSX parsing
      },
    },
    env: {
      browser: true,
      node: true,
      es2021: true,
    },
    extends: [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-native/all",
    ],
    plugins: [
      "react",
      "react-native",
    ],
    settings: {
        react: {
          version: "detect", // Automatically detect React version
        },
      },
      rules: {
        "react/react-in-jsx-scope": "off", // Suppress the rule for React in scope
        'react-native/no-inline-styles': 0,
        'react-native/no-color-literals': 0,
      },
      
  };
  