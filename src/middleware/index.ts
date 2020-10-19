import { Context, Next } from 'koa';
import { IConstructor } from '../controller/mapper.router';

interface MiddleWare {
  use(ctx: Context, next: Next): any;
}

interface IMiddleWareConstructor extends IConstructor {
  use(ctx: Context, next: Next): any;
}

type MiddleWareFunction = (ctx: Context, next: Next) => any;

export { IMiddleWareConstructor, MiddleWare, MiddleWareFunction };
