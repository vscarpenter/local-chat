import { ref, computed } from 'vue'

const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: 'gpt-oss:20b',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000
}

const config = ref({ ...DEFAULT_CONFIG })
const isConnecting = ref(false)
const connectionError = ref(null)
const lastConnectionCheck = ref(null)
const currentController = ref(null)

export function useOllama(customConfig = {}) {
  Object.assign(config.value, customConfig)

  const isConnected = computed(() => !connectionError.value && lastConnectionCheck.value)
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const makeRequest = async (url, options = {}) => {
    const externalSignal = options.signal
    const controller = externalSignal ? null : new AbortController()
    const signal = externalSignal || controller?.signal
    const timeoutId = controller ? setTimeout(() => controller.abort(), config.value.timeout) : null

    try {
      const response = await fetch(url, {
        ...options,
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (timeoutId) clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Request canceled')
      }
      
      throw error
    }
  }

  const checkConnection = async () => {
    isConnecting.value = true
    connectionError.value = null

    try {
      const response = await makeRequest(`${config.value.baseUrl}/api/tags`)
      const data = await response.json()
      
      const hasModel = data.models?.some(model => 
        model.name === config.value.model || 
        model.name.startsWith(config.value.model + ':')
      )

      if (!hasModel) {
        throw new Error(`Model "${config.value.model}" not found. Please install it using: ollama pull ${config.value.model}`)
      }

      lastConnectionCheck.value = new Date()
      return true
    } catch (error) {
      connectionError.value = error.message
      return false
    } finally {
      isConnecting.value = false
    }
  }

  const generateResponse = async function* (messages, options = {}) {
    if (!isConnected.value) {
      const connected = await checkConnection()
      if (!connected) {
        throw new Error(connectionError.value || 'Failed to connect to Ollama')
      }
    }

    const payload = {
      model: config.value.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        ...options
      }
    }

    let retries = 0
    let lastError = null

    while (retries <= config.value.maxRetries) {
      try {
        // Setup abort controller for streaming
        const controller = new AbortController()
        currentController.value = controller
        const response = await makeRequest(`${config.value.baseUrl}/api/chat`, {
          method: 'POST',
          body: JSON.stringify(payload),
          signal: controller.signal
        })

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim())

            for (const line of lines) {
              try {
                const data = JSON.parse(line)
                
                if (data.error) {
                  throw new Error(data.error)
                }

                if (data.message?.content) {
                  yield data.message.content
                }

                if (data.done) {
                  return
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming response:', parseError)
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
        currentController.value = null
        return
      } catch (error) {
        currentController.value = null
        lastError = error
        retries++

        if (retries <= config.value.maxRetries) {
          await sleep(config.value.retryDelay * retries)
          continue
        }

        if (error.message.includes('timeout') || error.message.includes('fetch')) {
          connectionError.value = 'Connection lost'
        }

        throw new Error(`Failed to generate response: ${error.message}`)
      }
    }
  }

  const cancel = () => {
    try {
      if (currentController.value) {
        currentController.value.abort()
        currentController.value = null
      }
    } catch (e) {
      // ignore
    }
  }

  const generateSimpleResponse = async (messages, options = {}) => {
    let fullResponse = ''
    
    try {
      for await (const chunk of generateResponse(messages, options)) {
        fullResponse += chunk
      }
      return fullResponse
    } catch (error) {
      throw error
    }
  }

  const getModels = async () => {
    try {
      const response = await makeRequest(`${config.value.baseUrl}/api/tags`)
      const data = await response.json()
      return data.models || []
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error.message}`)
    }
  }

  const setModel = (modelName) => {
    config.value.model = modelName
  }

  const updateConfig = (newConfig) => {
    Object.assign(config.value, newConfig)
    connectionError.value = null
    lastConnectionCheck.value = null
  }

  return {
    config: computed(() => config.value),
    isConnected,
    isConnecting,
    connectionError,
    checkConnection,
    generateResponse,
    generateSimpleResponse,
    getModels,
    setModel,
    updateConfig,
    cancel
  }
}
