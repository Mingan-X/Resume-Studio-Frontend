import path from 'node:path';

// Resolve relative imports too: alias-only restrictions can be bypassed with ../.
export const architectureRule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { boundary: '违反架构依赖方向或feature公开入口：{{target}}' },
  },
  create(context) {
    const root = path.resolve('src');
    const source = path.relative(root, context.filename).replaceAll('\\', '/');
    const layers = ['shared', 'features', 'pages', 'app'];
    function check(node) {
      const value = node.source?.value;
      if (typeof value !== 'string' || (!value.startsWith('.') && !value.startsWith('@/'))) return;
      const target = path
        .relative(
          root,
          value.startsWith('@/')
            ? path.resolve(root, value.slice(2))
            : path.resolve(path.dirname(context.filename), value),
        )
        .replaceAll('\\', '/');
      const [from, feature] = source.split('/');
      const [to, targetFeature, ...rest] = target.split('/');
      const fromRank = layers.indexOf(from);
      const toRank = layers.indexOf(to);
      const wrongDirection = fromRank >= 0 && toRank > fromRank;
      const privateFeature =
        to === 'features' &&
        !(from === 'features' && feature === targetFeature) &&
        rest.length > 0 &&
        !(rest.length === 1 && /^index(?:\.ts)?$/.test(rest[0]));
      const generated =
        to === 'generated' && !/^(shared\/api\/|features\/[^/]+\/(api|model)\/)/.test(source);
      if (wrongDirection || privateFeature || generated) {
        context.report({ node, messageId: 'boundary', data: { target } });
      }
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};
