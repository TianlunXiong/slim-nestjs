import Koa from 'koa';
import Router from 'koa-router';
import {
  ControllerToRouterMapper,
  HttpMethod,
  IConstructor,
} from '../controller/mapper.router';
import { MiddleWareFunction, MiddleWare } from '../middleware';
import { injectableClassSet } from '../injector';

class AppCore extends Koa {
  router = new Router();
  controllerToMiddlewareMapping = new Map<IConstructor, IControllerMiddleWare[]>();
  routerGraph = new Map<string, {}>();

  constructor() {
    super();
  }
  routeMapping(mapper: ControllerToRouterMapper) {
    const { mapping } = mapper;
    for (let [Controller, controllerRouter] of mapping) {
      const middlewares =
        this.controllerToMiddlewareMapping.get(Controller) || [];
      const { prefix = '', subRoutes } = controllerRouter;
      for (let i = 0; i < subRoutes.length; i += 1) {
        const { method, pathRule, handler } = subRoutes[i];
        const rule = `/${prefix}/${pathRule}`
          .replace(/\/+/, '/')
          .replace(/\/$/, '');
        if (middlewares.length) {
          for (let i = 0; i < middlewares.length; i += 1) {
            const { useFn, method } = middlewares[i];
            if (method) {
              this.router[method](rule, useFn);
            } else {
              this.router.use(rule, useFn);
            }
          }
        }
        const controller = DependenceFactory.create<{
          [method: string]: Function;
        }>(Controller);
        this.router[method](rule, async (ctx, next) => {
          await controller[handler](ctx);
          await next();
        });
      }
    }
  }

  /**
   * 
   * @param middlewareCtor 
   * @param ctor
   * @description 为某个路由或者控制器提供中间件
   */
  useForRoutes<T extends MiddleWare>(
    middlewareCtor: { new (...args: any[]): T },
    ctor: IConstructor,
    config?: {
      method: HttpMethod
    }
  ): void;
  useForRoutes<T extends MiddleWare>(
    middlewareCtor: { new (...args: any[]): T },
    path: string,
  ): void;
  useForRoutes<T extends MiddleWare>(
    middlewareCtor: { new (...args: any[]): T },
    params: IPathParams,
  ): void;
  useForRoutes<T extends MiddleWare>(
    middlewareCtor: { new (...args: any[]): T },
    params: IConstructor | string | IPathParams,
    config?: {
      method: HttpMethod
    }
  ) {
    const middleware = DependenceFactory.create<MiddleWare>(middlewareCtor);
    const useFn: MiddleWareFunction = middleware.use.bind(middleware);
    if (typeof params === 'string') {
      const rule = params;
      this.router.use(rule, useFn);
    } else if (typeof params === 'object') {
      const { path, method } = params;
      this.router[method](path, useFn);
    } else {
      const Ctor = params; // Controller
      const useFnWrapper: IControllerMiddleWare = {
        useFn,
      }
      if (config) {
        const { method } = config;
        if (method) {
          useFnWrapper.method = method;
        }
      }
      if (!this.controllerToMiddlewareMapping.has(Ctor)) {
        const middlewares: IControllerMiddleWare[] = [];
        middlewares.push(useFnWrapper);
        this.controllerToMiddlewareMapping.set(Ctor, middlewares);
      } else {
        const middlewares = this.controllerToMiddlewareMapping.get(Ctor);
        middlewares?.push(useFnWrapper);
      }
    }
  }
}

interface IControllerMiddleWare {
  useFn: MiddleWareFunction;
  method?: HttpMethod;
}

interface IPathParams {
  path: string;
  method: HttpMethod;
}

class DependenceFactory {
  static create<T>(Constructor: { new (...args: any[]): T }): T;
  static create<T>(Constructor: { new (...args: any[]): T }): T;
  static create<T>(Constructor: { new (...args: any[]): T }): T {
    const paramsTypes: Array<IConstructor> = Reflect.getMetadata(
      'design:paramtypes',
      Constructor,
    );
    const paramInstances =
      paramsTypes?.map((v, i) => {
        if (!injectableClassSet.has(v)) {
          throw new Error(`类${v.name}不可注入`);
        } else if (v?.length) {
          return DependenceFactory.create(v); // 递归构造
        } else {
          return new v();
        }
      }) || [];

    return new Constructor(...paramInstances);
  }
}

class Dependence<T> {
  parent: Dependence<T> | null = null;
  children: Dependence<T>[] | null = null;
  ctor: { new (...args: any[]): T } | null = null;

  setCtor(ctor: { new (...args: any[]): T }) {
    this.ctor = ctor;
  }

  setParent(p: Dependence<T>) {
    this.parent = p;
  }

  pushChild(c: Dependence<T>) {
    this.children?.push(c);
  }
}

class MiddlewareNode {
  name = '';

  setName(str: string) {
    this.name = str;
  }
}


class ControllerNode {
  name = '';
  middlewares: MiddlewareNode[] = [];
  ctor: IConstructor | null = null;

  setName(str: string) {
    this.name = str;
  }
}


export default AppCore;
