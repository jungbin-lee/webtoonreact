export interface LoraConfig {
    name: string;
    model_weight: number;
    clip_weight: number;
  }
  
  export interface GenerateRequest {
    prompt: string;
    loras: LoraConfig[];
    width: number;
    height: number;
    steps: number;
  }