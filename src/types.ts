export interface ToolStep {
  step: number;
  cmd: string;
  description: string;
  output?: string;
}

export interface StudyModule {
  id: string;
  title: string;
  category: 'Fundamentals' | 'Networking' | 'Tools' | 'Emerging' | 'Malware' | 'Phishing' | 'Threat Intel' | 'AI Security';
  keywords: string[];
  theory: string;
  realWorldExample?: string;
  commands: ToolStep[];
  codeSnippet?: {
    language: string;
    code: string;
  };
  labSetup: string;
  vmSteps?: string;
  defense: string;
  cehMap: string;
  practice: string;
  quiz?: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
  glossary?: {
    term: string;
    definition: string;
  }[];
}

