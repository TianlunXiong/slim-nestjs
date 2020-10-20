import {
  ControllerToRouterMapper,
  ControllerRouter,
  HttpMethod,
  IConstructor,
} from './mapper.router';

const routerMapper = new ControllerToRouterMapper();

function Controller<T extends IConstructor>(prefix?: string) {
  return function (constructor: T) {
    if (routerMapper.hasRouter(constructor)) {
      const controllerRouter = routerMapper.getRouter(constructor);
      controllerRouter?.setPrefix(prefix);
    }
  };
}

function HttpMethodGenerator(method: HttpMethod) {
  return function (pathRule?: string) {
    return function (target: any, name: string, descriptor: any) {
      const { constructor } = target;
      if (!routerMapper.hasRouter(constructor)) {
        const controllerRouter = new ControllerRouter(constructor.name);
        const route = {
          method,
          handler: name,
          parent: controllerRouter,
          pathRule: pathRule || '',
        };
        controllerRouter.pushRoute(route);
        controllerRouter.setRouteMap(`${name}.${method}.${pathRule}`, route);
        routerMapper.setMapping(constructor, controllerRouter);
      } else {
        const controllerRouter = routerMapper.getRouter(constructor);
        const key = `${name}.${method}.${pathRule}`;
        if (controllerRouter && !controllerRouter?.hasRoute(key)) {
          const route = {
            method,
            handler: name,
            parent: controllerRouter,
            pathRule: pathRule || '',
          };
          controllerRouter?.pushRoute(route);
          controllerRouter.setRouteMap(key, route);
        }
      }
    };
  };
}

const Get = HttpMethodGenerator(HttpMethod.GET);
const Post = HttpMethodGenerator(HttpMethod.POST);
const Options = HttpMethodGenerator(HttpMethod.OPTIONS);
const Put = HttpMethodGenerator(HttpMethod.PUT);
const Delete = HttpMethodGenerator(HttpMethod.DELETE);
const Head = HttpMethodGenerator(HttpMethod.HEAD);
const Link = HttpMethodGenerator(HttpMethod.LINK);
const Unlink = HttpMethodGenerator(HttpMethod.UNLINK);

export {
  Controller,
  routerMapper,
  Get,
  Post,
  Options,
  Put,
  Delete,
  Head,
  Link,
  Unlink,
  HttpMethod,
};
