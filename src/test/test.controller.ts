import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  getTest(@Query() query: unknown) {
    return {
      message: 'Test GET endpoint',
      query,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  postTest(@Body() body: unknown) {
    return {
      message: 'Test POST endpoint',
      receivedBody: body,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  getTestById(@Param('id') id: string) {
    return {
      message: 'Test GET by ID endpoint',
      id,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('error/400')
  getBadRequest() {
    throw new HttpException('Bad Request Test', HttpStatus.BAD_REQUEST);
  }

  @Get('error/404')
  getNotFound() {
    throw new HttpException('Not Found Test', HttpStatus.NOT_FOUND);
  }

  @Get('error/500')
  getInternalError() {
    throw new Error('Unexpected error occurred');
  }

  @Get('error/custom')
  getCustomError() {
    throw new HttpException(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Custom validation error',
        errors: ['Field is required', 'Invalid format'],
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  @Get('error/unhandled-rejection')
  getUnhandledRejection() {
    // Create an unhandled promise rejection
    Promise.reject(new Error('Test unhandled rejection'));
    
    return {
      message: 'Unhandled rejection triggered',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('error/async-error')
  async getAsyncError() {
    // Create an async error that might not be caught
    setTimeout(() => {
      throw new Error('Async error after timeout');
    }, 100);
    
    return {
      message: 'Async error will be triggered',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('error/rejection-string')
  getRejectionWithString() {
    // Create unhandled rejection with string reason
    Promise.reject('String rejection reason');
    
    return {
      message: 'String rejection triggered',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('error/rejection-object')
  getRejectionWithObject() {
    // Create unhandled rejection with object reason
    Promise.reject({
      code: 'CUSTOM_ERROR',
      message: 'Object rejection reason',
      details: { userId: 123, action: 'test' }
    });
    
    return {
      message: 'Object rejection triggered',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('error/rejection-null')
  getRejectionWithNull() {
    // Create unhandled rejection with null reason
    Promise.reject(null);
    
    return {
      message: 'Null rejection triggered',
      timestamp: new Date().toISOString(),
    };
  }
}
