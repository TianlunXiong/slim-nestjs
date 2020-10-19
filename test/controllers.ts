import { Context, Next } from 'koa';
import { Controller, Get } from '../src/controller';
import { Injectable } from '../src/injector';
import { MiddleWare } from '../src/middleware';

@Injectable
class AllList {
  log() {
    console.log('Ha');
  }

  count(): string {
    return 'list: 1,2,3';
  }
}

class LikeMiddleWare implements MiddleWare {
  async use(ctx: Context, next: Next) {
    console.log('123')
    ctx.body = 'jiu'
    await next();
  }
}

@Controller('api')
class Xiaobai {
  constructor(private inject: AllList) {}

  @Get('student')
  score(ctx: Context) {
    ctx.body += 'Hello';
  }
  
  @Get('student/:id')
  async student(ctx: Context) {
    ctx.body = 'Hello, Student1';
  }
}

export {
  LikeMiddleWare,
  Xiaobai,
}