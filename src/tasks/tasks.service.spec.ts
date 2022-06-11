import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateTaskDto } from './dto/create-task.dto';

import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { TaskRepository } from './task.repository';
import { TasksService } from './tasks.service';

const mockTaskRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
});

const mockUser = { username: 'JohnDoe', id: 777 };

describe('TasksService', () => {
  let tasksService;
  let taskRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useFactory: mockTaskRepository },
      ],
    }).compile();

    tasksService = await module.get<TasksService>(TasksService);
    taskRepository = await module.get<TaskRepository>(TaskRepository);
  });

  describe('getTasks', () => {
    it('gets all tasks from the repository', async () => {
      taskRepository.getTasks.mockResolvedValue('someValue');

      expect(taskRepository.getTasks).not.toHaveBeenCalled();
      const filters: GetTasksFilterDto = {
        status: TaskStatus.IN_PROGRESS,
        search: 'query',
      };
      const result = await tasksService.getTasks(filters, mockUser);
      expect(taskRepository.getTasks).toHaveBeenCalled();
      expect(result).toEqual('someValue');
    });
  });

  describe('getTaskById', () => {
    it('calls taskRepository.findOne() and successfully retrieve and return the task', async () => {
      const mockTask = {
        title: 'Test task',
        description: 'Test desc',
      };
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await tasksService.getTaskById(1, mockUser);
      expect(result).toEqual(mockTask);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
      });
    });

    it('throws an error as task is not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      expect(tasksService.getTaskById(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTask', () => {
    it('calls taskRepository.create() and returns new task', async () => {
      expect(taskRepository.createTask).not.toHaveBeenCalled();
      const createTask: CreateTaskDto = {
        title: 'Test task',
        description: 'Test desc',
      };
      taskRepository.createTask.mockResolvedValue('Task');
      const result = await tasksService.createTask(createTask, mockUser);
      expect(taskRepository.createTask).toHaveBeenCalledWith(
        createTask,
        mockUser,
      );
      expect(result).toEqual('Task');
    });
  });

  describe('deleteTask', () => {
    it('calls taskRepository.delete and removes task', async () => {
      const taskToDeleteId = 'Task to delete';
      expect(taskRepository.delete).not.toHaveBeenCalled();
      taskRepository.delete.mockResolvedValue({ affected: 1 });
      await tasksService.deleteTask(taskToDeleteId, mockUser);
      expect(taskRepository.delete).toHaveBeenCalledWith({
        id: taskToDeleteId,
        userId: mockUser.id,
      });
    });

    it('throws an error as task could not be found', async () => {
      taskRepository.delete.mockResolvedValue({ affected: 0 });
      expect(tasksService.deleteTask(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTaskStatus', () => {
    it('updates status of the task', async () => {
      taskRepository.findOne.mockResolvedValue({
        id: 1,
        status: TaskStatus.OPEN,
        save: jest.fn().mockResolvedValue(true),
      });
      const updatedTask = await tasksService.updateTaskStatus(
        1,
        TaskStatus.IN_PROGRESS,
        mockUser,
      );
      expect(updatedTask.save).toHaveBeenCalled();
      expect(updatedTask.status).toEqual(TaskStatus.IN_PROGRESS);
    });

    it('throws an error when task is not found', () => {
      taskRepository.findOne.mockResolvedValue(null);
      expect(
        tasksService.updateTaskStatus(1, TaskStatus.IN_PROGRESS, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
