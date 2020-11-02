import App, { HttpMethod } from '../src';
import { LikeMiddleWare, Xiaobai } from './controllers';

const app = new App();

app.use(async (ctx, next) => {
  await next();
})
app.useForRoutes(LikeMiddleWare, '/api');
app.useForRoutes(LikeMiddleWare, {
  path: '/nk',
  method: HttpMethod.GET,
});
app.useForRoutes(LikeMiddleWare, Xiaobai, { method: HttpMethod.GET })

app.routes();
app.listen(9001, () => console.log('ok'));
