import App, { HttpMethod } from '../src';

import { LikeMiddleWare, Xiaobai } from './controllers';

const app = new App();

app.use(async (ctx, next) => {
  await next();
})

app.useForRoutes(LikeMiddleWare, '/nk');
app.useForRoutes(LikeMiddleWare, {
  path: '/nk',
  method: HttpMethod.GET,
});
app.useForRoutes(LikeMiddleWare, Xiaobai, { method: HttpMethod.GET })

app.routes();

app.use(async function Shiji(ctx, next){
  await next();
})

app.listen(9001, () => {
  console.log(app.graphRootNode.next?.get('匿名中间件(0)')?.next?.get('路由中间件'))
});
