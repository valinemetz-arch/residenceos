export interface ValidationError {
  [field: string]: string;
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableNumber(value: unknown) {
  return value === null || typeof value === "number";
}

export const validationSchemas = {
  space(data: Record<string, unknown>) {
    const errors: ValidationError = {};

    if (!isNonEmptyString(data.name)) {
      errors.name = "Name is required.";
    }

    if (!isNonEmptyString(data.building)) {
      errors.building = "Building is required.";
    }

    if (!isNullableNumber(data.floor)) {
      errors.floor = "Floor must be a number or blank.";
    }

    if (!isNullableNumber(data.squareFootage)) {
      errors.squareFootage = "Square footage must be a number or blank.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  asset(data: Record<string, unknown>) {
    const errors: ValidationError = {};

    if (!isNonEmptyString(data.name)) {
      errors.name = "Asset name is required.";
    }

    if (!isNonEmptyString(data.spaceId)) {
      errors.spaceId = "Space is required.";
    }

    if (!isNonEmptyString(data.status)) {
      errors.status = "Status is required.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  task(data: Record<string, unknown>) {
    const errors: ValidationError = {};

    if (!isNonEmptyString(data.title)) {
      errors.title = "Task title is required.";
    }

    if (!isNonEmptyString(data.status)) {
      errors.status = "Status is required.";
    }

    if (!isNonEmptyString(data.priority)) {
      errors.priority = "Priority is required.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  budgetItem(data: Record<string, unknown>) {
    const errors: ValidationError = {};

    if (!isNonEmptyString(data.description)) {
      errors.description = "Item name is required.";
    }

    if (!isNonEmptyString(data.category)) {
      errors.category = "Category is required.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};
