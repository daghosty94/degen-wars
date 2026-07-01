export class MatchRelay {
  constructor(io, relayUrl) {
    this._io = io;
    this._relayUrl = relayUrl;
    this._socket = null;
    this._matchId = null;
  }

  connect() {
    this._socket = this._io(this._relayUrl, { transports: ['websocket'] });
    this._socket.on('connect', () => console.log('[MatchRelay] connected to', this._relayUrl));
    this._socket.on('disconnect', () => console.log('[MatchRelay] disconnected'));
    this._socket.on('connect_error', (err) => console.warn('[MatchRelay] connection error:', err.message));
    return this;
  }

  createMatch() {
    return new Promise((resolve, reject) => {
      if (!this._socket) return reject(new Error('Not connected'));
      this._socket.emit('create_match', (response) => {
        if (response?.error) return reject(new Error(response.error));
        this._matchId = response.matchId;
        resolve(response.matchId);
      });
    });
  }

  joinMatch(matchId) {
    return new Promise((resolve, reject) => {
      if (!this._socket) return reject(new Error('Not connected'));
      this._socket.emit('join_match', { matchId }, (response) => {
        if (response?.error) return reject(new Error(response.error));
        this._matchId = matchId;
        resolve(response);
      });
    });
  }

  shareUrl() {
    if (!this._matchId) return window.location.href;
    const url = new URL(window.location.href);
    url.searchParams.set('match', this._matchId);
    return url.toString();
  }

  on(event, handler) {
    this._socket?.on(event, handler);
    return this;
  }

  emit(event, ...args) {
    this._socket?.emit(event, ...args);
    return this;
  }

  disconnect() {
    this._socket?.disconnect();
    this._socket = null;
  }
}
