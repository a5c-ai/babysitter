// Curated model catalog — static list of popular open models for one-click deploy.
// Storage URIs use HuggingFace Hub format (hf://) that KServe can pull directly.
// Classical ML models use Google Cloud Storage examples that are publicly accessible.

export const CURATED_MODELS = [
  // LLMs
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', category: 'LLM', provider: 'Meta', modelFormat: 'huggingface', storageUri: 'hf://meta-llama/Llama-3.1-8B-Instruct', runtime: 'vllm', description: 'General-purpose LLM, good balance of speed and quality', gpu: true, minGpu: 1, minMemory: '16Gi' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', category: 'LLM', provider: 'Meta', modelFormat: 'huggingface', storageUri: 'hf://meta-llama/Llama-3.1-70B-Instruct', runtime: 'vllm', description: 'High-quality LLM for complex tasks', gpu: true, minGpu: 4, minMemory: '80Gi' },
  { id: 'mistral-7b', name: 'Mistral 7B', category: 'LLM', provider: 'Mistral AI', modelFormat: 'huggingface', storageUri: 'hf://mistralai/Mistral-7B-Instruct-v0.3', runtime: 'vllm', description: 'Fast and efficient LLM', gpu: true, minGpu: 1, minMemory: '16Gi' },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', category: 'LLM', provider: 'Mistral AI', modelFormat: 'huggingface', storageUri: 'hf://mistralai/Mixtral-8x7B-Instruct-v0.1', runtime: 'vllm', description: 'Mixture of experts model', gpu: true, minGpu: 2, minMemory: '48Gi' },
  { id: 'phi-3-mini', name: 'Phi-3 Mini', category: 'LLM', provider: 'Microsoft', modelFormat: 'huggingface', storageUri: 'hf://microsoft/Phi-3-mini-4k-instruct', runtime: 'vllm', description: 'Small but capable language model', gpu: true, minGpu: 1, minMemory: '8Gi' },
  { id: 'gemma-2-9b', name: 'Gemma 2 9B', category: 'LLM', provider: 'Google', modelFormat: 'huggingface', storageUri: 'hf://google/gemma-2-9b-it', runtime: 'vllm', description: 'Lightweight open model from Google', gpu: true, minGpu: 1, minMemory: '16Gi' },
  { id: 'qwen-2.5-7b', name: 'Qwen 2.5 7B', category: 'LLM', provider: 'Alibaba', modelFormat: 'huggingface', storageUri: 'hf://Qwen/Qwen2.5-7B-Instruct', runtime: 'vllm', description: 'Multilingual LLM with strong coding abilities', gpu: true, minGpu: 1, minMemory: '16Gi' },
  // Code models
  { id: 'codellama-13b', name: 'Code Llama 13B', category: 'Code', provider: 'Meta', modelFormat: 'huggingface', storageUri: 'hf://meta-llama/CodeLlama-13b-Instruct-hf', runtime: 'vllm', description: 'Specialized for code generation and understanding', gpu: true, minGpu: 1, minMemory: '24Gi' },
  { id: 'starcoder2-7b', name: 'StarCoder2 7B', category: 'Code', provider: 'BigCode', modelFormat: 'huggingface', storageUri: 'hf://bigcode/starcoder2-7b', runtime: 'vllm', description: 'Code-focused model trained on The Stack v2', gpu: true, minGpu: 1, minMemory: '16Gi' },
  // Embedding models
  { id: 'bge-large', name: 'BGE Large', category: 'Embedding', provider: 'BAAI', modelFormat: 'huggingface', storageUri: 'hf://BAAI/bge-large-en-v1.5', runtime: 'huggingface', description: 'Text embedding model for RAG and search', gpu: false, minMemory: '4Gi' },
  { id: 'e5-mistral', name: 'E5 Mistral 7B', category: 'Embedding', provider: 'Microsoft', modelFormat: 'huggingface', storageUri: 'hf://intfloat/e5-mistral-7b-instruct', runtime: 'huggingface', description: 'Instruction-tuned embedding model', gpu: true, minGpu: 1, minMemory: '16Gi' },
  // Vision
  { id: 'llava-1.6-7b', name: 'LLaVA 1.6 7B', category: 'Vision', provider: 'LLaVA Team', modelFormat: 'huggingface', storageUri: 'hf://llava-hf/llava-v1.6-mistral-7b-hf', runtime: 'vllm', description: 'Multimodal vision-language model', gpu: true, minGpu: 1, minMemory: '16Gi' },
  // Speech
  { id: 'whisper-large-v3', name: 'Whisper Large v3', category: 'Speech', provider: 'OpenAI', modelFormat: 'huggingface', storageUri: 'hf://openai/whisper-large-v3', runtime: 'huggingface', description: 'Speech-to-text transcription', gpu: true, minGpu: 1, minMemory: '8Gi' },
  // Classical ML (publicly accessible GCS examples)
  { id: 'sklearn-iris', name: 'Iris Classifier', category: 'Classical ML', provider: 'scikit-learn', modelFormat: 'sklearn', storageUri: 'gs://kserve-examples/models/sklearn/1.0/model', runtime: 'kserve-sklearnserver', description: 'Example sklearn classifier for testing', gpu: false, minMemory: '1Gi' },
  { id: 'xgboost-iris', name: 'XGBoost Iris', category: 'Classical ML', provider: 'XGBoost', modelFormat: 'xgboost', storageUri: 'gs://kserve-examples/models/xgboost/iris', runtime: 'kserve-xgbserver', description: 'Example XGBoost model for testing', gpu: false, minMemory: '1Gi' },
];

export const MODEL_CATEGORIES = [...new Set(CURATED_MODELS.map(m => m.category))];
