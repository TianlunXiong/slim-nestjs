import AppCore from './app.core';
import { routerMapper } from '../controller';

class App extends AppCore {
  constructor() {
    super();
  }

  routes() {
    this.routeMapping(routerMapper);
    const routeMiddleware = this.router.routes();
    this.use(routeMiddleware);
  }
}

export default App;
