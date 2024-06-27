'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, continueConversation } from './actions';
import { readStreamableValue } from 'ai/rsc';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default function Home() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const { messages, newMessage } = await continueConversation([
      ...conversation,
      { role: 'user', content: input },
    ]);

    let textContent = '';

    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([
        ...messages,
        { role: 'assistant', content: textContent },
      ]);
    }

    setInput('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatContainer} ref={chatContainerRef}>
        {conversation.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.messageContainer,
              justifyContent:
                message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                ...styles.messageBubble,
                backgroundColor: message.role === 'user' ? '#DCF8C6' : '#EAEAEA',
                color: message.role === 'user' ? '#000' : '#000',
              }}
            >
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong>{' '}
              <ReactMarkdown
                components={{
                  code({
                    node,
                    inline,
                    className,
                    children,
                    ...props
                  }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          ref={inputRef}
          onChange={event => {
            setInput(event.target.value);
          }}
          onKeyPress={handleKeyPress}
          style={styles.input}
        />
        <button onClick={handleSendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    height: '100vh',
    padding: '10px',
    backgroundColor: '#121212',
    color: '#E0E0E0',
  },
  chatContainer: {
    flex: 1,
    overflowY: 'auto' as 'auto',
    marginBottom: '10px',
    padding: '10px',
  },
  messageContainer: {
    display: 'flex',
    marginBottom: '10px',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    overflowX: 'auto' as 'auto',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginRight: '10px',
    backgroundColor: '#2D2D2D',
    color: '#E0E0E0',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: '#FFF',
    cursor: 'pointer',
  },
};