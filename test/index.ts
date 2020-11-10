import App from '../src';
import './controllers';

const app = new App();

app.use(async function SSO(ctx, next) {
  await next();
});
app.routes();

app.use(async function Log(ctx, next) {
  await next();
});

app.use(async function Resource(ctx, next) {
  await next();
});

app.listen(9001, () => {
  app.cycleLog();
});
