import { Context, Next } from 'koa';
import { Controller, Get, Injectable, MiddleWare } from '../src';

@Injectable
class AllList {
  log() {
    console.log('Ha');
  }

  count(): string {
    return 'list: 1,2,3';
  }
}

class Student implements MiddleWare {
  async use(ctx: Context, next: Next) {
    ctx.body = 'jiu';
    await next();
  }
}

@Controller('/')
class Xiaobai {
  constructor(private inject: AllList) {}

  @Get()
  score(ctx: Context) {
    ctx.body = 'Hello';
  }

  @Get('student/:id')
  async student(ctx: Context) {
    ctx.body = 'Hello, Student1';
  }
}

export { Student, Xiaobai };
