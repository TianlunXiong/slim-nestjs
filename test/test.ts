import App from '../src';
import { LikeMiddleWare, Xiaobai } from './controllers';

const app = new App();

app.useForRoutes(LikeMiddleWare, '/api')

app.routes();
app.listen(9001, () => console.log('ok'));
