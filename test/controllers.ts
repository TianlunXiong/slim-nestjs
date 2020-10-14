import { Context } from 'koa';
import { Controller, Get } from '../src/controller'

@Controller('api')
class Xiaobai {
  @Get()
  score(ctx: Context) {
    ctx.body = 'Hello';
  }
  
  @Get('student')
  student(ctx: Context) {
    ctx.body = 'Hello, Student1';
  }
}