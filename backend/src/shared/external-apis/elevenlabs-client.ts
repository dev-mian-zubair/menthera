import { SecretsHelper } from '../utils/secrets-helper';
import { ELEVENLABS_CONFIG } from '../config/voice.config';

export interface ElevenLabsVoiceCloneRequest {
  name: string;
  description?: string;
  files: Buffer[]; // Audio file buffers
  labels?: Record<string, string>;
}

export interface ElevenLabsVoiceCloneResponse {
  voice_id: string;
  name: string;
  status: string;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description?: string;
  category: string;
  labels: Record<string, string>;
  samples: Array<{
    sample_id: string;
    file_name: string;
  }>;
}

export class ElevenLabsClient {
  private apiKey: string | null = null;
  private readonly baseUrl = ELEVENLABS_CONFIG.baseUrl;

  constructor() {}

  private async getApiKey(): Promise<string> {
    if (!this.apiKey) {
      this.apiKey = await SecretsHelper.getSecretValue('ELEVENLABS_API_KEY');
    }
    return this.apiKey;
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Clone a voice using audio files
   */
  async cloneVoice(request: ElevenLabsVoiceCloneRequest): Promise<ElevenLabsVoiceCloneResponse> {
    const formData = new FormData();

    formData.append('name', request.name);
    if (request.description) {
      formData.append('description', request.description);
    }

    // Add audio files
    request.files.forEach((fileBuffer, index) => {
      const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
      formData.append('files', blob, `sample_${index}.mp3`);
    });

    // Add labels
    if (request.labels) {
      formData.append('labels', JSON.stringify(request.labels));
    }

    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        // Don't set Content-Type for FormData - let the browser set it
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voice cloning failed (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<ElevenLabsVoiceCloneResponse>;
  }

  /**
   * Get voice details by ID
   */
  async getVoice(voiceId: string): Promise<ElevenLabsVoice> {
    return this.makeRequest(`/voices/${voiceId}`);
  }

  /**
   * List all voices
   */
  async listVoices(): Promise<{ voices: ElevenLabsVoice[] }> {
    return this.makeRequest('/voices');
  }

  /**
   * Delete a voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete voice (${response.status}): ${errorText}`);
    }
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(
    voiceId: string,
    text: string,
    voiceSettings?: {
      stability: number;
      similarity_boost: number;
      style?: number;
    }
  ): Promise<Buffer> {
    const apiKey = await this.getApiKey();

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_settings: voiceSettings || {
          stability: ELEVENLABS_CONFIG.stability,
          similarity_boost: ELEVENLABS_CONFIG.similarityBoost,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Speech generation failed (${response.status}): ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
