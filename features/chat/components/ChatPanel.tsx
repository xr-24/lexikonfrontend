import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../../src/store/gameStore';
import type { ChatMessage } from '../types/chat';
import './ChatPanel.css';

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onToggle,
  unreadCount,
}) => {
  const [message, setMessage] = useState('');
  const [colorInput, setColorInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMessages = useGameStore((state) => state.chatMessages);
  const playerName = useGameStore((state) => state.playerName);
  const playerId = useGameStore((state) => state.playerId);
  const playerChatColor = useGameStore((state) => state.playerChatColor);
  const sendChatMessage = useGameStore((state) => state.sendChatMessage);
  const setPlayerChatColor = useGameStore((state) => state.setPlayerChatColor);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && playerName && playerId) {
      sendChatMessage(message.trim());
      setMessage('');
    }
  };

  const handleColorChange = (color: string) => {
    // Validate hex color format
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (hexRegex.test(color)) {
      setPlayerChatColor(color);
    }
  };

  const isMyMessage = (msg: ChatMessage) => msg.playerId === playerId;

  return (
    <div className="chat-panel">
      <div className="chat-header" onClick={onToggle}>
        <h3>chat</h3>
        <div className="chat-controls">
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
          <span className={`chat-toggle ${isOpen ? 'open' : 'closed'}`}>
            {isOpen ? '▼' : '▲'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="chat-content">
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-messages">
                <p>no messages yet...</p>
                <p>start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${isMyMessage(msg) ? 'own-message' : 'other-message'}`}
                >
                  <div className="message-header">
                    <span 
                      className="player-name" 
                      style={{ color: msg.playerColor }}
                    >
                      {msg.playerName}
                    </span>
                  </div>
                  <div className="message-content">
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-section">
            <div className="chat-input-header">
              <div className="color-input-group">
                <label htmlFor="color-input">color:</label>
                <input
                  id="color-input"
                  type="text"
                  value={colorInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setColorInput(value);
                    if (value.startsWith('#') && value.length === 7) {
                      handleColorChange(value);
                    }
                  }}
                  placeholder={playerChatColor || '#DC143C'}
                  maxLength={7}
                  className="color-input"
                />
              </div>
              <span 
                className="current-name-preview"
                style={{ color: playerChatColor || '#DC143C' }}
              >
                {playerName}
              </span>
            </div>
            
            <form onSubmit={handleSubmit} className="chat-form">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="type a message..."
                maxLength={200}
                className="chat-input"
              />
              <button 
                type="submit" 
                disabled={!message.trim()}
                className="send-button"
              >
                send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};