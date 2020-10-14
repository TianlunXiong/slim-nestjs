import Koa from 'koa';
import Router from 'koa-router';
import { ControllerToRouterMapper, HttpMethod } from '../controller/mapper.router';

class AppCore extends Koa {
  constructor() {
    super();
  }
  
  routeMapping(router: Router, mapper: ControllerToRouterMapper) {
    const { mapping } = mapper;
    for (let [Controller, controllerRouter] of mapping) {
      const { prefix, subRoutes } = controllerRouter;
      for (let i = 0; i < subRoutes.length; i += 1) {
        const { method, pathRule, handler } = subRoutes[i];
        const rule = `/${prefix}/${pathRule}`.replace(/\/+/, '/').replace(/\/$/, '');
        router[HttpMethod[method]](rule, async (ctx, next) => {
          const controller = new Controller();
          controller[handler](ctx);
          await next();
        })
      }
    }
  }
}

export default AppCore;