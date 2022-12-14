import { ValidationError } from 'class-validator';
import { ValidationErrorException } from 'src/common/exception/validation.exception';

export const transformValidationErrors = (e: ValidationError[]) => {
  const errors = e.reduce((acc, curr) => {
    acc[curr.property] = Object.keys(curr.constraints).map(
      (key) => curr.constraints[key],
    );
    return acc;
  }, {} as Record<string, string[]>);
  throw new ValidationErrorException(errors);
};

export const exclude = <T extends Record<string, unknown>, Key extends keyof T>(
  user: T,
  ...keys: Key[]
): Omit<T, Key> => {
  for (const key of keys) delete user[key];
  return user;
};
