import { ExamForTestEngine, QuestionStatus } from '@/types';

export type AnswerValue = string | string[] | null;

export interface TestEngineState {
  started: boolean;
  timeLeft: number;
  currentQIndex: number;
  exitCount: number;
  isFullscreenError: boolean;
  warningReason: string;
  answers: Record<string, AnswerValue>;
  questionTimes: Record<string, number>;
  activeSection: string;
  qStatus: Record<string, QuestionStatus>;
  calcOpen: boolean;
  zoomImage: string | null;
  showSubmitModal: boolean;
  showQuestionPaper: boolean;
  showInstructions: boolean;
}
