# react-ant-resource-form
> Antd form builder for resource form.

## installation
```shell
yarn add @jswork/react-ant-resource-form
```

## setup
```ts
import { config as niceFormConfig } from '@ebay/nice-form-react';
import antdAdapter from '@ebay/nice-form-react/adapters/antdAdapter';

niceFormConfig.addAdapter(antdAdapter);
```

## tsconfig
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": [
      "ES2020",
      "DOM",
      "DOM.Iterable"
    ],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noImplicitAny": false,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    // 这一行是关键配置
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "node_modules/@jswork"],
  "references": [
    {
      "path": "./tsconfig.node.json"
    }
  ]
}
```
