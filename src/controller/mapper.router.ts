type IController = { new (): any };

enum HttpMethod {
  get = 'get',
  post = 'post'
}

interface IControllerRoute {
  method: HttpMethod,
  pathRule: string
  handler: string,
  parent: ControllerRouter,
}

class ControllerToRouterMapper {
  mapping = new Map<IController, ControllerRouter>()

  setMapping(target: IController, controllerRouter: ControllerRouter) {
    this.mapping.set(target, controllerRouter);
  }

  hasRouter(target: IController) : boolean {
    return this.mapping.has(target);
  }

  getRouter(target: IController) : ControllerRouter | undefined {
    return this.mapping.get(target) || undefined;
  }

  log() {
    for (let [, v] of this.mapping) {
      v.log();
    }
  }
}

class ControllerRouter {
  prefix : string = '';
  subRoutes : IControllerRoute[] = [];
  routeMap = new Map<string, IControllerRoute>();
  className: string = '';

  constructor(name: string) {
    this.className = name;
  }

  hasRoute(k: string): IControllerRoute | undefined {
    return this.routeMap.get(k);
  }

  setRouteMap(k: string, v: IControllerRoute) {
    this.routeMap.set(k, v);
  }

  setPrefix(s: string = '') {
    this.prefix = `${s}`;
  }

  pushRoute(route : IControllerRoute) {
    this.subRoutes.push(route);
  }

  log() {
    let str = `class: ${this.className}\n`;
    for (let i = 0; i < this.subRoutes.length; i += 1) {
      const route = this.subRoutes[i];
      const { method, pathRule, handler } = route;
      str += `${method} /${this.prefix}/${pathRule} ${this.className}.${handler}\n`;
    }
    console.log(str);
  }
}

export {
  IController,
  IControllerRoute,
  HttpMethod,
  ControllerToRouterMapper,
  ControllerRouter,
}