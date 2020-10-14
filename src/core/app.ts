import AppCore from './app.core';
import Router from './router';
import { routerMapper } from '../controller';

const router = new Router();

class App extends AppCore {
  constructor() {
    super();
    routerMapper.log();
    this.routeMapping(router, routerMapper);
    this.use(router.routes());
  }
}

export default App;