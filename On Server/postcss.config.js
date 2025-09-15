module.exports = {
  plugins: {
    'postcss-prefix-selector': {
      prefix: '.bootstrap-scope',
      transform: (prefix, selector, prefixedSelector) => {
        // Force all :root vars into the wrapper div
        if (selector === ':root') {
          return `${prefix}`;
        }
        // Handle html and body -> scope them too
        if (selector.startsWith('html') || selector.startsWith('body')) {
          return `${prefix} ${selector}`;
        }
        return prefixedSelector;
      }
    }
  }
};
