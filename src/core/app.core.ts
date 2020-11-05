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
  controllerToMiddlewareMapping = new Map<
    IConstructor,
    IControllerMiddleWare[]
  >();
  graphRootNode = new GraphNode('root');
  currentGraphNode: GraphNode = this.graphRootNode;
  routeNode = new RouteNode('路由中间件');

  constructor() {
    super();
  }

  use<NewStateT = {}, NewCustomT = {}>(
    middleware: Koa.Middleware<NewStateT, NewCustomT>,
  ): Koa<NewStateT, NewCustomT> {
    const name = middleware.name || `匿名中间件(${MiddlewareNode.anonymousCount++})`;
    if (name === 'dispatch') {
      this.currentGraphNode = this.currentGraphNode.setNext(this.routeNode);
    } else {
      const middlewareNode = new MiddlewareNode(name, middleware);
      this.currentGraphNode = this.currentGraphNode.setNext(middlewareNode);
    }
    return super.use(middleware);
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
          .replace(/\/+/, '/');
        const ruleNode = this.routeNode.setInnerNode(new RuleNode(`规则${RuleNode.count++}`, rule));
        let middlewareNode;
        let methodNode;
        if (middlewares.length) {
          for (let i = 0; i < middlewares.length; i += 1) {
            const { useFn, method } = middlewares[i];
            if (method) {
              methodNode = ruleNode.setNext(new MethodNode(`方法${MethodNode.count++}`, method));
              middlewareNode = methodNode.setNext(new MiddlewareNode(useFn.name || `匿名中间件(${MiddlewareNode.anonymousCount++})`, useFn));
              this.router[method](rule, useFn);
            } else {
              middlewareNode = ruleNode.setNext(new MiddlewareNode(useFn.name || `匿名中间件(${MiddlewareNode.anonymousCount++})`, useFn));
              this.router.use(rule, useFn);
            }
          }
        }

        const controller = DependenceFactory.create<{
          [method: string]: Function;
        }>(Controller);
        if (middlewareNode) {
          middlewareNode.setNext(new ControllerNode(
            Controller.name,
            Controller,
            handler,
            controller,
          ));
        } else {
          ruleNode.setNext(new ControllerNode(
            Controller.name,
            Controller,
            handler,
            controller,
          ));
        }
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
      method: HttpMethod;
    },
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
      method: HttpMethod;
    },
  ) {
    const middleware = DependenceFactory.create<MiddleWare>(middlewareCtor);
    const useFn: MiddleWareFunction = middleware.use.bind(middleware);
    if (typeof params === 'string') {
      const rule = params;
      const ruleNode = this.routeNode.setInnerNode(new RuleNode(`规则${RuleNode.count++}`, rule));
      const middlewareNode = ruleNode.setNext(new MiddlewareNode(middlewareCtor.name || `匿名中间件(${MiddlewareNode.anonymousCount++})`, useFn));
      this.router.use(rule, useFn);
    } else if (typeof params === 'object') {
      const { path, method } = params;
      const ruleNode = this.routeNode.setInnerNode(new RuleNode(`规则${RuleNode.count++}`, path));
      const methodNode = ruleNode.setNext(new MethodNode(`方法${MethodNode.count++}`, method));
      const middlewareNode = methodNode.setNext(new MiddlewareNode(middlewareCtor.name || `匿名中间件(${MiddlewareNode.anonymousCount++})`, useFn));
      this.router[method](path, useFn);
    } else {
      const Ctor = params; // Controller
      const useFnWrapper: IControllerMiddleWare = {
        useFn,
      };
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

class GraphNode {
  name = '';
  next: Map<string, GraphNode> | null = null

  constructor(name: string) {
    this.name = name;
  }
  
  setNext(node: GraphNode): GraphNode{
    if (!this.next) {
      this.next = new Map();
    }
    this.next.set(node.name, node);
    return node;
  }
}

class MiddlewareNode<NewStateT = {}, NewCustomT = {}> extends GraphNode {
  public static anonymousCount = 0;
  useFn: Koa.Middleware<NewStateT, NewCustomT> | null = null

  constructor(name: string, fn: Koa.Middleware<NewStateT, NewCustomT>) {
    super(name);
    this.useFn = fn;
  }
}


class RouteNode extends GraphNode {
  innerNode: Map<string, GraphNode> | null = null
  constructor(name: string) {
    super(name);
  }

  setInnerNode(node: GraphNode): GraphNode{
    if (!this.innerNode) {
      this.innerNode = new Map();
    }
    this.innerNode.set(node.name, node);
    return node;
  }
}

class RuleNode extends GraphNode {
  public static count = 0;
  rule: string = '';

  constructor(name: string, rule: string) {
    super(name);
    this.rule = rule;
  }
}

class MethodNode extends GraphNode {
  public static count = 0;
  method: string = '';

  constructor(name: string, method: string) {
    super(name);
    this.method = method;
  }
}

class ControllerNode extends GraphNode {
  Ctor: IConstructor | null = null;
  controller: {} | null = null;
  handler: string = '';

  constructor(name: string, ctor: IConstructor, handler: string, controller: {}) {
    super(name);
    this.Ctor = ctor;
    this.handler = handler;
    this.controller = controller;
  }
}


export default AppCore;
