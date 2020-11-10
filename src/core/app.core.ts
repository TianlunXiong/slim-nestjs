import Koa from 'koa';
import Router from 'koa-router';
import fs from 'fs';
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
  rootNode = new HeadNode('head');
  routeNode = new RouteNode('--路由--');

  currentNode = this.rootNode;

  constructor() {
    super();
  }

  use<NewStateT = {}, NewCustomT = {}>(
    middleware: Koa.Middleware<NewStateT, NewCustomT>,
  ): Koa<NewStateT, NewCustomT> {
    const name = middleware.name || `匿名(${MiddlewareNode.anonymousCount++})`;
    if (name === 'dispatch') {
      this.currentNode = this.currentNode.setNext(this.routeNode);
    } else {
      const middlewareNode = new MiddlewareNode(name, middleware);
      this.currentNode = this.currentNode.setNext(middlewareNode);
    }
    return super.use(
      async function (ctx, next) {
        await middleware(ctx, next);
      }
    );
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
        const ruleNode = this.routeNode.setLinkGroupNode(new RuleNode(`规则${RuleNode.count++}`, rule));
        let middlewareNode;
        let methodNode;
        if (middlewares.length) {
          for (let i = 0; i < middlewares.length; i += 1) {
            const { useFn, method, name } = middlewares[i];
            if (method) {
              methodNode = ruleNode.setNext(new MethodNode(`方法${MethodNode.count++}`, method));
              middlewareNode = methodNode.setNext(new MiddlewareNode(name || `匿名中间件(${MiddlewareNode.anonymousCount++})`, useFn));
              this.router[method](rule, useFn);
            } else {
              middlewareNode = ruleNode.setNext(new MiddlewareNode(name || `匿名中间件(${MiddlewareNode.anonymousCount++})`, useFn));
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
  ): AppCore;
  useForRoutes<T extends MiddleWare>(
    middlewareCtor: { new (...args: any[]): T },
    path: string,
  ): AppCore;
  useForRoutes<T extends MiddleWare>(
    middlewareCtor: { new (...args: any[]): T },
    params: IPathParams,
  ): AppCore;
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
      const ruleNode = this.routeNode.setLinkGroupNode(new RuleNode(`规则${RuleNode.count++}`, rule));
      const middlewareNode = ruleNode.setNext(new MiddlewareNode(middlewareCtor.name || `匿名中间件(${MiddlewareNode.anonymousCount++})`, useFn));
      this.router.use(rule, useFn);
    } else if (typeof params === 'object') {
      const { path, method } = params;
      const ruleNode = this.routeNode.setLinkGroupNode(new RuleNode(`规则${RuleNode.count++}`, path));
      const methodNode = ruleNode.setNext(new MethodNode(`方法${MethodNode.count++}`, method));
      const middlewareNode = methodNode.setNext(new MiddlewareNode(middlewareCtor.name || `匿名中间件(${MiddlewareNode.anonymousCount++})`, useFn));
      this.router[method](path, useFn);
    } else {
      const Ctor = params; // Controller Constructor
      const useFnWrapper: IControllerMiddleWare = {
        useFn,
        name: middlewareCtor.name,
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
    return this;
  }

  cycleLog() {
    let cur = this.rootNode;
    let str = '请求/响应循环：';
    while (cur.next) {
      cur = cur.next;
      const { type, info } = cur;
      if (type === "路由中间件") {
        str += `\n\t[${cur.type}: ${cur.info()}]---->${this.routeNode.linkBundleRoot.allThrough()}`;
      } else {
        str += `\n\t[${cur.type}: ${cur.info()}]`;
      }
    }
    const writeStream = fs.createWriteStream('./route', 'utf-8');
    writeStream.write(str);
  }
}

interface IControllerMiddleWare {
  useFn: MiddleWareFunction;
  method?: HttpMethod;
  name: string;
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

class LinkBundle {
  static size = 0;

  nexts: Map<Symbol, LinkNode> | null = null

  setNext(node: LinkNode): LinkNode{
    if (!this.nexts) {
      this.nexts = new Map();
    }
    this.nexts.set(Symbol.for(`[${LinkBundle.size++}]${node.name}`), node);
    return node;
  }

  allThrough(): string {
    if (!this.nexts) return '';

    let str = '\n\t';
    for (let [k, v] of this.nexts) {
      str += oneThrough(v) + '\n\t' ;
    }
    return str.replace(/\n\t$/, '');
    function oneThrough(linkNode: LinkNode): string {
      let cur: LinkNode | null = linkNode;
      let str = '';
      while (cur) {
        str += `\t[${cur.type}: ${cur.info()}]` + '-->';
        cur = cur.next;
      }
      return str;
    }
  }
}

abstract class LinkNode implements IInfo {
  name = '';
  next: LinkNode | null = null;
  abstract info(): string;
  abstract type: LINK_NODE_TYPE;

  constructor(name: string) {
    this.name = name;
  }

  setNext(node: LinkNode): LinkNode {
    this.next = node;
    return node;
  }


}

class HeadNode extends LinkNode {
  type = LINK_NODE_TYPE.HEAD;

  constructor(name: string) {
    super(name)
  }
  info() {
    return this.name;
  }
}

enum LINK_NODE_TYPE {
  HEAD = '入口',
  MIDDLE = '中间件',
  ROUTE = '路由中间件',
  RULE = '请求路径',
  METHOD = '请求方法',
  HANDLER = '控制器'
}

class MiddlewareNode<NewStateT = {}, NewCustomT = {}> extends LinkNode {
  public static anonymousCount = 0;
  type = LINK_NODE_TYPE.MIDDLE;
  useFn: Koa.Middleware<NewStateT, NewCustomT> | null = null

  constructor(name: string, fn: Koa.Middleware<NewStateT, NewCustomT>) {
    super(name);
    this.useFn = fn;
  }

  info() {
    return this.name;
  }
}


class RouteNode extends LinkNode {
  type = LINK_NODE_TYPE.ROUTE;
  linkBundleRoot = new LinkBundle();

  constructor(name: string) {
    super(name);
  }

  setLinkGroupNode(node: LinkNode): LinkNode {
    return this.linkBundleRoot.setNext(node);
  }

  info() {
    return this.name;
  }
}

interface IInfo {
  info(): string;
  type: string;
}

class RuleNode extends LinkNode {
  static count = 0;

  type = LINK_NODE_TYPE.RULE;
  rule: string = '';

  constructor(name: string, rule: string) {
    super(name);
    this.rule = rule;
  }
  
  info() {
    return this.rule;
  }
}

class MethodNode extends LinkNode {
  static count = 0;

  type = LINK_NODE_TYPE.METHOD;
  method: string = '';

  constructor(name: string, method: string) {
    super(name);
    this.method = method;
  }

  info() {
    return this.method;
  }
}

class ControllerNode extends LinkNode {
  type = LINK_NODE_TYPE.HANDLER;
  Ctor: IConstructor | null = null;
  controller: {} | null = null;
  handler: string = '';

  constructor(name: string, ctor: IConstructor, handler: string, controller: {}) {
    super(name);
    this.Ctor = ctor;
    this.handler = handler;
    this.controller = controller;
  }

  info() {
    return `${this.Ctor?.name || '未知Controller'}.${this.handler}`;
  }
}


export default AppCore;
