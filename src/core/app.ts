import AppCore from './app.core';
import { routerMapper } from '../controller';


class App extends AppCore {
  constructor() {
    super();
  }

  routes() {
    this.routeMapping(routerMapper);
    this.use(this.router.routes());
  }
}

export default App;