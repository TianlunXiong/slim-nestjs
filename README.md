# Slim NestJS

## Introduction

A Dependency-Inject Framework based on Koa.

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

then
```

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