import Koa from 'koa';
import Router from 'koa-router';
import {
  ControllerToRouterMapper,
  IConstructor,
} from '../controller/mapper.router';
import { MiddleWareFunction, MiddleWare } from '../middleware';
import { injectableClassSet } from '../injector';

class AppCore extends Koa {
  router = new Router();
  controllerToMiddlewareMapping = new Map<IConstructor, MiddleWareFunction[]>();

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
        if (middlewares.length) this.router.use(rule, ...middlewares);
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
  ): void;
  useForRoutes<T extends MiddleWare>(
    middlewareCtor: { new (...args: any[]): T },
    path: string,
  ): void;
  useForRoutes<T extends MiddleWare>(
    middlewareCtor: { new (...args: any[]): T },
    params: IConstructor | string,
  ) {
    const middleware = DependenceFactory.create<MiddleWare>(middlewareCtor);
    const useFn: MiddleWareFunction = middleware.use.bind(middleware);
    if (typeof params === 'string') {
      const rule = params;
      this.router.use(rule, useFn);
    } else {
      const Ctor = params; // Controller
      if (!this.controllerToMiddlewareMapping.has(Ctor)) {
        const middlewares: MiddleWareFunction[] = [];
        middlewares.push(useFn);
        this.controllerToMiddlewareMapping.set(Ctor, middlewares);
      } else {
        const middlewares = this.controllerToMiddlewareMapping.get(Ctor);
        middlewares?.push(useFn);
      }
    }
  }
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

export default AppCore;
