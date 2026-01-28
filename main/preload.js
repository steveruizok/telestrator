/**
 * Preload script for Telestrator
 *
 * This script runs in a privileged context before the renderer process loads.
 * It uses contextBridge to safely expose limited APIs to the renderer.
 *
 * Security: This replaces the insecure `remote` module usage with a secure
 * IPC-based approach following Electron security best practices.
 */

const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window control methods (replaces remote.getCurrentWindow())
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  setIgnoreMouseEvents: (ignore, options) =>
    ipcRenderer.invoke('window:setIgnoreMouseEvents', ignore, options),

  // Listen for messages from main process
  onProjectMessage: (callback) => {
    // Remove any existing listener to prevent duplicates
    ipcRenderer.removeAllListeners('projectMsg')
    ipcRenderer.on('projectMsg', (event, data) => callback(data))
  },

  // Clean up listener when component unmounts
  removeProjectMessageListener: () => {
    ipcRenderer.removeAllListeners('projectMsg')
  }
})
