import App from '../src';
import { LikeMiddleWare } from './controllers';

const app = new App();

app.use(async (ctx, next) => {
  await next();
  console.log('123')
})
app.useForRoutes(LikeMiddleWare, '/api');

app.routes();
app.listen(9001, () => console.log('ok'));
