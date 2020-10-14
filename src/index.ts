import AppCore from './core/app';
import Router from './core/router';
import { routerMapper } from './controller';

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

