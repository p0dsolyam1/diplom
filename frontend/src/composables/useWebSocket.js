import { ref, onUnmounted } from 'vue'

const WS_URL = `ws://${location.host}/ws`
const RECONNECT_DELAY = 2000

export function useWebSocket() {
  const isConnected = ref(false)
  const error = ref(null)

  let ws = null
  let reconnectTimer = null
  let messageHandlers = {}
  let shouldReconnect = false

  function connect() {
    shouldReconnect = true
    _connect()
  }

  function _connect() {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      isConnected.value = true
      error.value = null
    }

    ws.onclose = () => {
      isConnected.value = false
      if (shouldReconnect) {
        reconnectTimer = setTimeout(_connect, RECONNECT_DELAY)
      }
    }

    ws.onerror = () => {
      error.value = 'Ошибка WebSocket соединения'
    }

    ws.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        console.error('WS: невалидный JSON', event.data)
        return
      }
      const handler = messageHandlers[msg.type]
      if (handler) handler(msg)
    }
  }

  function disconnect() {
    shouldReconnect = false
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    isConnected.value = false
  }

  /**
   * Отправить обработанный кадр на сервер.
   * @param {string} base64   - base64 кадра (уже обрезанного по мишени)
   * @param {number} exerciseId
   * @param {{ x: number, y: number }} offset - смещение обрезки в исходном кадре
   * @param {Array<{x,y}>|null} corners - углы калибровки в координатах полного кадра
   */
  function sendFrame(base64, exerciseId, offset = { x: 0, y: 0 }, corners = null) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'frame', data: base64, exerciseId, offset, corners }))
  }

  function on(type, handler) {
    messageHandlers[type] = handler
  }

  function off(type) {
    delete messageHandlers[type]
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendFrame,
    on,
    off,
  }
}
