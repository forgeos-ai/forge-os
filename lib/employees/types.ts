export type EmployeeId = "athena" | "atlas" | "hermes" | "qa";

export interface EmployeeProgress {
  current: number;
  total: number;
}

export interface EmployeeQuestionDto {
  id: string;
  order: number;
  text: string;
}
