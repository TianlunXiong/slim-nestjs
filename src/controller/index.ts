import process from 'process';
import { ControllerToRouterMapper, ControllerRouter, IController, HttpMethod } from './mapper.router';

const routerMapper = new ControllerToRouterMapper();

function Controller(prefix: string) {
  return function(target: IController) {
    if (routerMapper.hasRouter(target)) {
      const controllerRouter = routerMapper.getRouter(target);
      controllerRouter?.setPrefix(prefix);
    }
  }
}

function Get(pathRule?: string) {
  return function(target: any, name: string, descriptor: any) {
    const { constructor } = target;
    if (!routerMapper.hasRouter(constructor)) {
      const controllerRouter = new ControllerRouter(constructor.name);
      const route = {
        method: HttpMethod.get,
        handler: name,
        parent: controllerRouter,
        pathRule: pathRule || '',
      }
      controllerRouter.pushRoute(route);
      controllerRouter.setRouteMap(`${name}.get.${pathRule}`, route);
      routerMapper.setMapping(constructor, controllerRouter);
    } else {
      const controllerRouter = routerMapper.getRouter(constructor);
      const key = `${name}.get.${pathRule}`;
      if (controllerRouter && !controllerRouter?.hasRoute(key)) {
        const route = {
          method: HttpMethod.get,
          handler: name,
          parent: controllerRouter,
          pathRule: pathRule || '',
        }
        controllerRouter?.pushRoute(route);
        controllerRouter.setRouteMap(`${name}.get.${pathRule}`, route);
      }
    }
  }
}

export {
  Controller,
  Get,
  routerMapper,
}