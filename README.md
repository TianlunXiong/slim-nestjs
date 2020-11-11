# Slim NestJS

## Introduction

A Dependency-Inject Framework Based On Koa. A Reduced Version Of The Well-Known Framework NestJS.

## ToDo
- [x] 控制器的基本修饰器（Controller、Get、Post等）
- [x] 控制器的依赖注入
- [ ] 中间件的依赖注入（待测试）
- [x] 请求/响应循环基本节点
- [ ] 日志系统
- [ ] 可视化监控系统
- [ ] 测试用例
- [ ] 集成前端Webpack开发环境
- [ ] 集成ORM数据库管理系统

## install

```
yarn add slim-nestjs
```

## usage

The App is actually equivalent to Koa as well known. The related  APIs can be found in https://koajs.com or https://www.koajs.com.cn

### 1. run server

```ts
// index.ts

import App from 'slim-nestjs';

const app = new App(); // as new Koa()
const PORT = 9001;

app.use(async (ctx, next) => {
  await next();
  ctx.body = 'Hello World!'
})
app.routes(); // resolve controllers and middlewares 
app.listen(PORT, () => console.log(`the server run on ${PORT}`));

```

### 2. add controller

```ts
// controller.hello.ts

import { Context, Next, Controller, Get } from 'slim-nestjs';

@Controller('prefix')
class Hello {
  constructor(private inject: AllList) {}

  @Get()
  score(ctx: Context) {
    ctx.body = 'Hello World!';
  }

  @Get('api/:id')
  async student(ctx: Context) {
    const { id } = ctx.params
    ctx.body = `api, ${id}`;
  }
}

export { LikeMiddleWare, Xiaobai };

```

then 