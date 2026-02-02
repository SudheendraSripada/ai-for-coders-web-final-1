import { AIManager } from './ai-manager';
import { AnalysisResult, ProviderType } from './types';

export class VisionAnalyzer {
  private aiManager: AIManager;

  constructor(aiManager: AIManager) {
    this.aiManager = aiManager;
  }

  async analyzeScreenshot(
    imageData: string,
    model: string,
    provider: ProviderType,
    prompt?: string
  ): Promise<AnalysisResult> {
    const providerInstance = this.aiManager.getProvider(provider);
    
    if (!providerInstance.analyzeImage) {
        throw new Error(`Provider ${provider} does not support image analysis`);
    }

    // Check if model supports vision
    const modelInfo = providerInstance.getModelInfo(model);
    if (!modelInfo?.supportsVision) {
        // Try to find a vision model from the same provider
        const visionModel = providerInstance.getModels().find(m => m.supportsVision);
        if (visionModel) {
            console.warn(`Model ${model} does not support vision, switching to ${visionModel.id}`);
            model = visionModel.id;
        } else {
             throw new Error(`Model ${model} does not support vision and no fallback available`);
        }
    }

    try {
        return await providerInstance.analyzeImage(imageData, model, prompt);
    } catch (error) {
        console.error("Vision analysis failed", error);
        throw error;
    }
  }
}
