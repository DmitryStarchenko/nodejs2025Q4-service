import { NotFoundException, BadRequestException } from '@nestjs/common';
import { validate } from 'uuid';

export const validateId = (id: string) => {
  if (!validate(id)) {
    throw new BadRequestException('Bad request. id is invalid (not uuid)');
  }
};

export const handleDbOperation = async <T>(
  operation: () => Promise<T>,
  fallback: () => T,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }
    return fallback();
  }
};
