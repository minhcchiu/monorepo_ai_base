import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('welcome', () => {
    it('trả envelope thành công kèm message của AppService', () => {
      const result = appController.welcome();

      expect(result.success).toBe(true);
      expect(result.message).toBe('API is running');
      expect(result.data).toEqual({ message: appService.getWelcomeMessage() });
    });
  });
});
